package com.shuati.service.impl;

import com.shuati.entity.AnswerRecord;
import com.shuati.enums.CorrectStatus;
import com.shuati.mapper.AnswerRecordMapper;
import com.shuati.mapper.StudyProgressMapper;
import com.shuati.mapper.UserLastPracticeMapper;
import com.shuati.mapper.WrongNotebookMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncAnswerService {

    private final WrongNotebookMapper wrongNotebookMapper;
    private final StudyProgressMapper studyProgressMapper;
    private final AnswerRecordMapper answerRecordMapper;
    private final UserLastPracticeMapper userLastPracticeMapper;

    // 说明：@Async 方法抛出的异常不会传回已返回的 HTTP 调用线程，
    // 统一由 AsyncConfig.getAsyncUncaughtExceptionHandler 记录（含方法名与参数），
    // 这里不再 try/catch 吞掉，避免落库失败只留下一条 INFO 时间日志、数据静默丢失。
    @Async("answerAsyncExecutor")
    @Transactional
    public void insertAnswerRecord(AnswerRecord record) {
        long start = System.nanoTime();
        try {
            answerRecordMapper.insert(record);
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
            // 单条原子 SQL：答对置已掌握；答错「有则 +1 并置回未掌握、无则插入」，并发下不丢更新
            if (status == CorrectStatus.CORRECT) {
                wrongNotebookMapper.markMastered(studentId, questionId);
            } else {
                wrongNotebookMapper.upsertWrong(studentId, questionId);
            }
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
            int correctIncrement = status == CorrectStatus.CORRECT ? 1 : 0;
            // 同一知识点行的并发作答由 upsert 行锁串行化，计数不丢；随后在同一事务内重算掌握率
            studyProgressMapper.upsertCounts(userId, subjectId, firstKpId, correctIncrement);
            studyProgressMapper.recalcMastery(userId, subjectId, firstKpId);
        } finally {
            log.info("[async updateStudyProgress] {} ms, userId={}, subjectId={}",
                    (System.nanoTime() - start) / 1_000_000, userId, subjectId);
        }
    }

    @Async("answerAsyncExecutor")
    @Transactional
    public void updateLastPracticePosition(Long userId, Long subjectId, Long questionId) {
        long start = System.nanoTime();
        try {
            if (userId == null || subjectId == null || questionId == null) {
                return;
            }
            userLastPracticeMapper.upsertPosition(userId, subjectId, questionId);
        } finally {
            log.info("[async updateLastPracticePosition] {} ms, userId={}, subjectId={}",
                    (System.nanoTime() - start) / 1_000_000, userId, subjectId);
        }
    }
}
