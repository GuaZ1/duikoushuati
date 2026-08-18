package com.shuati.service.impl;

import com.shuati.context.UserContext;
import com.shuati.dto.AnswerRequest;
import com.shuati.dto.AnswerResultDto;
import com.shuati.entity.AnswerRecord;
import com.shuati.entity.Question;
import com.shuati.entity.QuestionOption;
import com.shuati.entity.WrongNotebook;
import com.shuati.enums.CorrectStatus;
import com.shuati.enums.QuestionType;
import com.shuati.mapper.WrongNotebookMapper;
import com.shuati.service.AnswerService;
import com.shuati.service.QuestionCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Slf4j

@Service
@RequiredArgsConstructor
public class AnswerServiceImpl implements AnswerService {

    private final QuestionCacheService questionCacheService;
    private final AsyncAnswerService asyncAnswerService;
    private final WrongNotebookMapper wrongNotebookMapper;

    // 错题本专项练习：连续答对累计到该权重即视为掌握，错题本不再展示该题
    private static final int MASTER_WEIGHT = 5;

    @Override
    public AnswerResultDto submitAnswer(AnswerRequest request) {
        long start = System.nanoTime();
        long stepStart = start;
        Question question = questionCacheService.getQuestionById(request.getQuestionId());   //根据题目id找题目
        long t1 = System.nanoTime();
        log.info("[submitAnswer] query question: {} ms", (t1 - stepStart) / 1_000_000);
        stepStart = t1;

        if (question == null) {
            throw new IllegalArgumentException("题目不存在");
        }
        CorrectStatus status = grade(question, request.getAnswer());    //判断对错
        long t2 = System.nanoTime();
        log.info("[submitAnswer] grade: {} ms", (t2 - stepStart) / 1_000_000);
        stepStart = t2;

        Long studentId = UserContext.getUserId();
        AnswerRecord record = new AnswerRecord();
        record.setStudentId(studentId);
        record.setQuestionId(question.getId());
        record.setStudentAnswer(request.getAnswer());
        record.setCorrectStatus(status);
        int score = status == CorrectStatus.CORRECT ? question.getScore() : 0;
        record.setScore(score);
        asyncAnswerService.insertAnswerRecord(record);
        long t3 = System.nanoTime();
        log.info("[submitAnswer] insert answer record (async): {} ms", (t3 - stepStart) / 1_000_000);
        stepStart = t3;

        AnswerResultDto result = new AnswerResultDto();
        result.setCorrectStatus(status);
        result.setCorrectAnswer(question.getAnswer());
        result.setAnalysis(question.getAnalysis());
        result.setScore(score);

        boolean wrongbookMode = "WRONGBOOK".equalsIgnoreCase(request.getMode());
        if (wrongbookMode) {
            // 错题本专项练习：同步更新权重，把最新 weight/mastered 直接回传给前端点亮 5 个点；
            // 不写学习进度、不更新"上次刷题位置"，避免污染普通练习的续做入口。
            WrongNotebook notebook = applyWrongbookWeight(studentId, question.getId(), status);
            if (notebook != null) {
                result.setWeight(notebook.getWeight());
                result.setMastered(notebook.getMastered());
            }
            long t4 = System.nanoTime();
            log.info("[submitAnswer] wrongbook weight update: {} ms", (t4 - stepStart) / 1_000_000);
            log.info("[submitAnswer] total: {} ms, questionId={}, studentId={}, mode=WRONGBOOK",
                    (t4 - start) / 1_000_000, request.getQuestionId(), studentId);
            return result;
        }

        asyncAnswerService.updateWrongNotebook(studentId, question.getId(), status);
        asyncAnswerService.updateStudyProgress(
                studentId, question.getSubjectId(), question.getKnowledgePointIds(), status);
        asyncAnswerService.updateLastPracticePosition(studentId, question.getSubjectId(), question.getId());
        long t4 = System.nanoTime();
        log.info("[submitAnswer] trigger async tasks: {} ms", (t4 - stepStart) / 1_000_000);

        log.info("[submitAnswer] total: {} ms, questionId={}, studentId={}",
                (t4 - start) / 1_000_000, request.getQuestionId(), studentId);

        return result;
    }

    // 错题本专项练习的权重结算：答对 +1（封顶 5，达到即掌握），答错清零重来；
    // 若该题不在错题本（已掌握或从未答错）则不做任何处理。
    private WrongNotebook applyWrongbookWeight(Long studentId, Long questionId, CorrectStatus status) {
        WrongNotebook notebook = wrongNotebookMapper.findByStudentIdAndQuestionId(studentId, questionId);
        if (notebook == null || Boolean.TRUE.equals(notebook.getMastered())) {
            return notebook;
        }
        int weight = notebook.getWeight() == null ? 0 : notebook.getWeight();
        if (status == CorrectStatus.CORRECT) {
            weight = Math.min(weight + 1, MASTER_WEIGHT);
            notebook.setWeight(weight);
            if (weight >= MASTER_WEIGHT) {
                notebook.setMastered(true);
            }
        } else {
            notebook.setWeight(0);
        }
        wrongNotebookMapper.update(notebook);
        return notebook;
    }

    private CorrectStatus grade(Question question, String studentAnswer) {
        if (studentAnswer == null || studentAnswer.isBlank()) {
            return CorrectStatus.WRONG;
        }
        QuestionType type = question.getType();
        if (type == QuestionType.SINGLE_CHOICE || type == QuestionType.TRUE_FALSE) {
            String correct = findCorrectOptionKey(question);
            return correct != null && correct.equalsIgnoreCase(studentAnswer.trim())
                    ? CorrectStatus.CORRECT : CorrectStatus.WRONG;
        }
        if (type == QuestionType.FILL_BLANK) {
            return gradeFillBlank(question.getAnswer(), studentAnswer);
        }
        return CorrectStatus.UNGRADED;
    }

    // 填空题判分（answer 规范见 batch-gen-question-sql skill）：
    // - 单空：answer 为标准答案文本；多空：answer 用 | 分隔各空答案，学生输入用逗号（,，）隔开；
    // - 同一空有多个可选答案：answer 用英文 or（前后带空格、不区分大小写）分隔，任选一个即可。
    // 比较大小写不敏感、忽略首尾空白，空数不一致判错。
    private CorrectStatus gradeFillBlank(String correctAnswer, String studentAnswer) {
        if (correctAnswer == null || correctAnswer.isBlank()) {
            return CorrectStatus.UNGRADED;
        }
        String[] correctBlanks = splitTrim(correctAnswer, "\\|");
        String[] studentBlanks = splitTrim(studentAnswer, "[,，]");
        if (correctBlanks.length != studentBlanks.length) {
            return CorrectStatus.WRONG;
        }
        for (int i = 0; i < correctBlanks.length; i++) {
            String studentBlank = studentBlanks[i];
            boolean anyMatch = false;
            for (String alternative : splitTrim(correctBlanks[i], "(?i)\\s+or\\s+")) {
                if (alternative.equalsIgnoreCase(studentBlank)) {
                    anyMatch = true;
                    break;
                }
            }
            if (!anyMatch) {
                return CorrectStatus.WRONG;
            }
        }
        return CorrectStatus.CORRECT;
    }

    // 按分隔符切分：去首尾空白、去掉多余空段
    private String[] splitTrim(String text, String regex) {
        return Arrays.stream(text.trim().split(regex))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }

    private String findCorrectOptionKey(Question question) {
        return questionCacheService.getOptionsByQuestionId(question.getId()).stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOption::getOptionKey)
                .findFirst()
                .orElse(question.getAnswer());
    }

}
