package com.shuati.service.impl;

import com.shuati.dto.AnswerRequest;
import com.shuati.dto.AnswerResultDto;
import com.shuati.entity.*;
import com.shuati.enums.CorrectStatus;
import com.shuati.enums.QuestionType;
import com.shuati.mapper.*;
import com.shuati.service.AnswerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnswerServiceImpl implements AnswerService {

    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final AnswerRecordMapper answerRecordMapper;
    private final WrongNotebookMapper wrongNotebookMapper;
    private final StudyProgressMapper studyProgressMapper;

    @Override
    @Transactional
    public AnswerResultDto submitAnswer(AnswerRequest request) {
        Question question = questionMapper.findById(request.getQuestionId());
        if (question == null) {
            throw new IllegalArgumentException("题目不存在");
        }

        CorrectStatus status = grade(question, request.getAnswer());

        AnswerRecord record = new AnswerRecord();
        record.setStudentId(request.getStudentId());
        record.setQuestionId(question.getId());
        record.setStudentAnswer(request.getAnswer());
        record.setCorrectStatus(status);
        record.setScore(status == CorrectStatus.CORRECT ? question.getScore() : 0);
        answerRecordMapper.insert(record);

        updateWrongNotebook(request.getStudentId(), question, status);
        updateStudyProgress(request.getStudentId(), question, status);

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
        return questionOptionMapper.findByQuestionId(question.getId()).stream()
                .filter(opt -> Boolean.TRUE.equals(opt.getIsCorrect()))
                .map(QuestionOption::getOptionKey)
                .findFirst()
                .orElse(question.getAnswer());
    }

    private CorrectStatus gradeMultipleChoice(Question question, String studentAnswer) {
        List<String> correctKeys = questionOptionMapper.findByQuestionId(question.getId()).stream()
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
        if (notebook == null) {
            notebook = new WrongNotebook();
            notebook.setStudentId(studentId);
            notebook.setQuestionId(question.getId());
            notebook.setWrongCount(0);
            notebook.setMastered(false);
        }
        if (status == CorrectStatus.CORRECT) {
            notebook.setMastered(true);
        } else {
            notebook.setWrongCount(notebook.getWrongCount() + 1);
            notebook.setMastered(false);
            notebook.setLastWrongAt(LocalDateTime.now());
        }
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
