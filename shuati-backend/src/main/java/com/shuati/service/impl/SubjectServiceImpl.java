package com.shuati.service.impl;

import com.shuati.entity.KnowledgePoint;
import com.shuati.entity.Subject;
import com.shuati.mapper.KnowledgePointMapper;
import com.shuati.mapper.SubjectMapper;
import com.shuati.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectMapper subjectMapper;
    private final KnowledgePointMapper knowledgePointMapper;

    @Override
    public List<Subject> list() {
        return subjectMapper.findAll();
    }

    @Override
    public Subject getById(Long id) {
        return subjectMapper.findById(id);
    }

    @Override
    public List<KnowledgePoint> listKnowledgePoints(Long subjectId) {
        return knowledgePointMapper.findBySubjectId(subjectId);
    }
}
