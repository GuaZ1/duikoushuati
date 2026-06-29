package com.shuati.service;

import com.shuati.entity.Subject;
import com.shuati.mapper.SubjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectMapper subjectMapper;

    @Override
    public List<Subject> list() {
        return subjectMapper.findAll();
    }

    @Override
    public Subject getById(Long id) {
        return subjectMapper.findById(id);
    }
}
