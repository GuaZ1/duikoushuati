package com.shuati.controller;

import com.shuati.dto.ApiResult;
import com.shuati.dto.ProgressDto;
import com.shuati.dto.WrongNotebookDto;
import com.shuati.entity.KnowledgePoint;
import com.shuati.entity.Question;
import com.shuati.entity.Subject;
import com.shuati.entity.User;
import com.shuati.entity.WrongNotebook;
import com.shuati.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;
    private final StudyProgressMapper studyProgressMapper;
    private final WrongNotebookMapper wrongNotebookMapper;
    private final SubjectMapper subjectMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final QuestionMapper questionMapper;

    @GetMapping("/{id}")
    public ApiResult<User> info(@PathVariable Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        return ApiResult.ok(user);
    }

    @GetMapping("/{id}/progress")
    public ApiResult<List<ProgressDto>> progress(@PathVariable Long id,
                                                  @RequestParam(required = false) Long subjectId) {
        List<com.shuati.entity.StudyProgress> list = studyProgressMapper.findByUserIdAndSubjectId(id, subjectId);

        List<Long> subjectIds = list.stream().map(com.shuati.entity.StudyProgress::getSubjectId).distinct().collect(Collectors.toList());
        List<Long> kpIds = list.stream().map(com.shuati.entity.StudyProgress::getKnowledgePointId).distinct().collect(Collectors.toList());
        Map<Long, String> subjectMap = subjectMapper.findAll().stream()
                .filter(s -> subjectIds.contains(s.getId()))
                .collect(Collectors.toMap(Subject::getId, Subject::getName));
        Map<Long, String> kpMap = knowledgePointMapper.findByIds(kpIds).stream()
                .collect(Collectors.toMap(KnowledgePoint::getId, KnowledgePoint::getName));

        List<ProgressDto> result = list.stream().map(p -> {
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
        return ApiResult.ok(result);
    }

    @GetMapping("/{id}/wrongbook")
    public ApiResult<List<WrongNotebookDto>> wrongBook(@PathVariable Long id) {
        List<WrongNotebook> list = wrongNotebookMapper.findByStudentIdAndMasteredFalse(id);
        List<Long> questionIds = list.stream().map(WrongNotebook::getQuestionId).distinct().collect(Collectors.toList());
        Map<Long, Question> questionMap = questionIds.stream()
                .map(questionMapper::findById)
                .filter(q -> q != null)
                .collect(Collectors.toMap(Question::getId, q -> q));

        List<WrongNotebookDto> result = list.stream().map(n -> {
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
        return ApiResult.ok(result);
    }
}
