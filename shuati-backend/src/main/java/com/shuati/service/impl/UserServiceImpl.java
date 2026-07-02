package com.shuati.service.impl;

import com.shuati.dto.ProgressDto;
import com.shuati.dto.UserStatisticsDto;
import com.shuati.dto.WrongNotebookDto;
import com.shuati.entity.KnowledgePoint;
import com.shuati.entity.Question;
import com.shuati.entity.Subject;
import com.shuati.entity.User;
import com.shuati.entity.WrongNotebook;
import com.shuati.mapper.KnowledgePointMapper;
import com.shuati.mapper.QuestionMapper;
import com.shuati.mapper.StudyProgressMapper;
import com.shuati.mapper.SubjectMapper;
import com.shuati.mapper.AnswerRecordMapper;
import com.shuati.mapper.UserMapper;
import com.shuati.mapper.WrongNotebookMapper;
import com.shuati.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final StudyProgressMapper studyProgressMapper;
    private final WrongNotebookMapper wrongNotebookMapper;
    private final SubjectMapper subjectMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final QuestionMapper questionMapper;
    private final AnswerRecordMapper answerRecordMapper;

    @Override
    public User info(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        return user;
    }

    @Override
    public List<ProgressDto> progress(Long userId, Long subjectId) {
        List<com.shuati.entity.StudyProgress> list = studyProgressMapper.findByUserIdAndSubjectId(userId, subjectId);

        List<Long> subjectIds = list.stream()
                .map(com.shuati.entity.StudyProgress::getSubjectId)
                .distinct()
                .collect(Collectors.toList());
        List<Long> kpIds = list.stream()
                .map(com.shuati.entity.StudyProgress::getKnowledgePointId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> subjectMap = subjectMapper.findAll().stream()
                .filter(s -> subjectIds.contains(s.getId()))
                .collect(Collectors.toMap(Subject::getId, Subject::getName));
        Map<Long, String> kpMap = kpIds.isEmpty()
                ? Map.of()
                : knowledgePointMapper.findByIds(kpIds).stream()
                        .collect(Collectors.toMap(KnowledgePoint::getId, KnowledgePoint::getName));

        return list.stream().map(p -> {
            ProgressDto dto = new ProgressDto();
            dto.setSubjectId(p.getSubjectId());
            dto.setSubjectName(subjectMap.getOrDefault(p.getSubjectId(), ""));
            dto.setKnowledgePointId(p.getKnowledgePointId());
            dto.setKnowledgePointName(kpMap.getOrDefault(p.getKnowledgePointId(), ""));
            dto.setPracticedCount(p.getPracticedCount());
            dto.setCorrectCount(p.getCorrectCount());
            dto.setMasteryRate(p.getMasteryRate());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<WrongNotebookDto> wrongBook(Long userId) {
        List<WrongNotebook> list = wrongNotebookMapper.findByStudentIdAndMasteredFalse(userId);
        List<Long> questionIds = list.stream()
                .map(WrongNotebook::getQuestionId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Question> questionMap = questionIds.stream()
                .map(questionMapper::findById)
                .filter(q -> q != null)
                .collect(Collectors.toMap(Question::getId, q -> q));

        return list.stream().map(n -> {
            Question q = questionMap.get(n.getQuestionId());
            WrongNotebookDto dto = new WrongNotebookDto();
            dto.setQuestionId(n.getQuestionId());
            dto.setContent(q != null ? q.getContent() : "");
            dto.setType(q != null ? q.getType() : null);
            dto.setDifficulty(q != null ? q.getDifficulty() : null);
            dto.setWrongCount(n.getWrongCount());
            dto.setLastWrongAt(n.getLastWrongAt());
            dto.setMastered(n.getMastered());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public UserStatisticsDto statistics(Long userId) {
        int total = answerRecordMapper.countTotalByStudentId(userId);
        int correct = total > 0 ? answerRecordMapper.countCorrectByStudentId(userId) : 0;
        UserStatisticsDto dto = new UserStatisticsDto();
        dto.setTodayCount(answerRecordMapper.countTodayByStudentId(userId));
        dto.setTotalCount(total);
        dto.setCorrectRate(total > 0 ? Math.round((correct * 100f) / total) : 0);
        return dto;
    }
}
