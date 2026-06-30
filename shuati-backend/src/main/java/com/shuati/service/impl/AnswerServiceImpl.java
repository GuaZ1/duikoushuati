package com.shuati.service.impl;

import com.shuati.dto.AnswerRequest;
import com.shuati.dto.AnswerResultDto;
import com.shuati.entity.*;
import com.shuati.enums.CorrectStatus;
import com.shuati.enums.QuestionType;
import com.shuati.mapper.*;
import com.shuati.service.AnswerService;
import com.shuati.service.QuestionCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j

@Service
@RequiredArgsConstructor
public class AnswerServiceImpl implements AnswerService {

    private final QuestionCacheService questionCacheService;
    private final AnswerRecordMapper answerRecordMapper;
    private final WrongNotebookMapper wrongNotebookMapper;
    private final StudyProgressMapper studyProgressMapper;

    @Override
    @Transactional
    public AnswerResultDto submitAnswer(AnswerRequest request) {
        long start = System.nanoTime();
        long stepStart = start;

        Question question = questionCacheService.getQuestionById(request.getQuestionId());   //根据用户的题目id找题目


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

        AnswerRecord record = new AnswerRecord();
        record.setStudentId(request.getStudentId());
        record.setQuestionId(question.getId());
        record.setStudentAnswer(request.getAnswer());
        record.setCorrectStatus(status);
        record.setScore(status == CorrectStatus.CORRECT ? question.getScore() : 0);
        answerRecordMapper.insert(record);                              //插入答题记录
        long t3 = System.nanoTime();
        log.info("[submitAnswer] insert answer record: {} ms", (t3 - stepStart) / 1_000_000);
        stepStart = t3;

        updateWrongNotebook(request.getStudentId(), question, status);  //更新错题本
        long t4 = System.nanoTime();
        log.info("[submitAnswer] update wrong notebook: {} ms", (t4 - stepStart) / 1_000_000);
        stepStart = t4;

        updateStudyProgress(request.getStudentId(), question, status);  //更新学习记录
        long t5 = System.nanoTime();
        log.info("[submitAnswer] update study progress: {} ms", (t5 - stepStart) / 1_000_000);

        log.info("[submitAnswer] total: {} ms, questionId={}, studentId={}",
                (t5 - start) / 1_000_000, request.getQuestionId(), request.getStudentId());

        AnswerResultDto result = new AnswerResultDto();
        result.setCorrectStatus(status);
        result.setCorrectAnswer(question.getAnswer());
        result.setAnalysis(question.getAnalysis());
        result.setScore(record.getScore());
        return result;
    }

    private CorrectStatus grade(Question question, String studentAnswer) {
        if (studentAnswer == null || studentAnswer.isBlank()) {
            return CorrectStatus.WRONG;
        }
        QuestionType type = question.getType();
        if (type == QuestionType.SINGLE_CHOICE || type == QuestionType.JUDGEMENT) {
            String correct = findCorrectOptionKey(question);
            return correct != null && correct.equalsIgnoreCase(studentAnswer.trim())
                    ? CorrectStatus.CORRECT : CorrectStatus.WRONG;
        }
        if (type == QuestionType.MULTIPLE_CHOICE) {
            return gradeMultipleChoice(question, studentAnswer);
        }
        return CorrectStatus.UNGRADED;
    }

    private String findCorrectOptionKey(Question question) {
        return questionCacheService.getOptionsByQuestionId(question.getId()).stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOption::getOptionKey)
                .findFirst()
                .orElse(question.getAnswer());
    }

    private CorrectStatus gradeMultipleChoice(Question question, String studentAnswer) {
        List<String> correctKeys = questionCacheService.getOptionsByQuestionId(question.getId()).stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOption::getOptionKey)
                .map(String::toUpperCase)
                .sorted()
                .collect(Collectors.toList());
        List<String> selectedKeys = Arrays.stream(studentAnswer.split("[,，]"))
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(s -> !s.isEmpty())
                .sorted()
                .collect(Collectors.toList());
        if (selectedKeys.equals(correctKeys)) {
            return CorrectStatus.CORRECT;
        }
        if (selectedKeys.isEmpty()) {
            return CorrectStatus.WRONG;
        }
        long correctCount = selectedKeys.stream().filter(correctKeys::contains).count();
        return correctCount > 0 ? CorrectStatus.PARTIAL : CorrectStatus.WRONG;
    }

    private void updateWrongNotebook(Long studentId, Question question, CorrectStatus status) {
        WrongNotebook notebook = wrongNotebookMapper.findByStudentIdAndQuestionId(studentId, question.getId());
        if (status == CorrectStatus.CORRECT) {
            if (notebook != null) {
                notebook.setMastered(true);
                wrongNotebookMapper.update(notebook);
            }
            return;
        }
        if (notebook == null) {
            notebook = new WrongNotebook();
            notebook.setStudentId(studentId);
            notebook.setQuestionId(question.getId());
            notebook.setWrongCount(0);
            notebook.setMastered(false);
        }
        notebook.setWrongCount(notebook.getWrongCount() + 1);
        notebook.setMastered(false);
        notebook.setLastWrongAt(LocalDateTime.now());
        if (notebook.getId() == null) {
            wrongNotebookMapper.insert(notebook);
        } else {
            wrongNotebookMapper.update(notebook);
        }
    }

    private void updateStudyProgress(Long userId, Question question, CorrectStatus status) {
        String kpIds = question.getKnowledgePointIds();
        if (kpIds == null || kpIds.isBlank()) {
            return;
        }
        Long firstKpId = Arrays.stream(kpIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .findFirst()
                .orElse(null);
        if (firstKpId == null) {
            return;
        }
        StudyProgress progress = studyProgressMapper
                .findByUserIdAndSubjectIdAndKnowledgePointId(userId, question.getSubjectId(), firstKpId);
        if (progress == null) {
            progress = new StudyProgress();
            progress.setUserId(userId);
            progress.setSubjectId(question.getSubjectId());
            progress.setKnowledgePointId(firstKpId);
            progress.setPracticedCount(0);
            progress.setCorrectCount(0);
            progress.setMasteryRate(0);
        }
        progress.setPracticedCount(progress.getPracticedCount() + 1);
        if (status == CorrectStatus.CORRECT) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
        }
        int rate = progress.getPracticedCount() == 0 ? 0
                : progress.getCorrectCount() * 100 / progress.getPracticedCount();
        progress.setMasteryRate(Math.min(rate, 100));
        if (progress.getId() == null) {
            studyProgressMapper.insert(progress);
        } else {
            studyProgressMapper.update(progress);
        }
    }
}
