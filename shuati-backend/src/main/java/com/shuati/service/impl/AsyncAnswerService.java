package com.shuati.service.impl;

import com.shuati.entity.AnswerRecord;
import com.shuati.entity.StudyProgress;
import com.shuati.entity.WrongNotebook;
import com.shuati.enums.CorrectStatus;
import com.shuati.mapper.AnswerRecordMapper;
import com.shuati.mapper.StudyProgressMapper;
import com.shuati.mapper.WrongNotebookMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncAnswerService {

    private final WrongNotebookMapper wrongNotebookMapper;
    private final StudyProgressMapper studyProgressMapper;
    private final AnswerRecordMapper answerRecordMapper;

    @Async("answerAsyncExecutor")
    @Transactional
    public void insertAnswerRecord(AnswerRecord record) {
        long start = System.nanoTime();
        try {
            answerRecordMapper.insert(record);
        } catch (Exception e) {
            log.error("[async insertAnswerRecord] failed, studentId={}, questionId={}",
                    record.getStudentId(), record.getQuestionId(), e);
        } finally {
            log.info("[async insertAnswerRecord] {} ms, studentId={}, questionId={}",
                    (System.nanoTime() - start) / 1_000_000, record.getStudentId(), record.getQuestionId());
        }
    }

    @Async("answerAsyncExecutor")
    @Transactional
    public void updateWrongNotebook(Long studentId, Long questionId, CorrectStatus status) {
        long start = System.nanoTime();
        try {
            WrongNotebook notebook = wrongNotebookMapper.findByStudentIdAndQuestionId(studentId, questionId);
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
                notebook.setQuestionId(questionId);
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
        } catch (Exception e) {
            log.error("[async updateWrongNotebook] failed, studentId={}, questionId={}, status={}",
                    studentId, questionId, status, e);
        } finally {
            log.info("[async updateWrongNotebook] {} ms, studentId={}, questionId={}",
                    (System.nanoTime() - start) / 1_000_000, studentId, questionId);
        }
    }

    @Async("answerAsyncExecutor")
    @Transactional
    public void updateStudyProgress(Long userId, Long subjectId, String knowledgePointIds, CorrectStatus status) {
        long start = System.nanoTime();
        try {
            if (knowledgePointIds == null || knowledgePointIds.isBlank()) {
                return;
            }
            Long firstKpId = Arrays.stream(knowledgePointIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .findFirst()
                    .orElse(null);
            if (firstKpId == null) {
                return;
            }
            StudyProgress progress = studyProgressMapper
                    .findByUserIdAndSubjectIdAndKnowledgePointId(userId, subjectId, firstKpId);
            if (progress == null) {
                progress = new StudyProgress();
                progress.setUserId(userId);
                progress.setSubjectId(subjectId);
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
        } catch (Exception e) {
            log.error("[async updateStudyProgress] failed, userId={}, subjectId={}, knowledgePointIds={}",
                    userId, subjectId, knowledgePointIds, e);
        } finally {
            log.info("[async updateStudyProgress] {} ms, userId={}, subjectId={}",
                    (System.nanoTime() - start) / 1_000_000, userId, subjectId);
        }
    }
}
