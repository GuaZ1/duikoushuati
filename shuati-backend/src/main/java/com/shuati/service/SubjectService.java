package com.shuati.service;

import com.shuati.entity.Subject;

import java.util.List;

public interface SubjectService {

    List<Subject> list();

    Subject getById(Long id);
}
