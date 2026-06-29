package com.shuati.service;

import com.shuati.dto.ProgressDto;
import com.shuati.dto.WrongNotebookDto;
import com.shuati.entity.User;

import java.util.List;

public interface UserService {

    User info(Long id);

    List<ProgressDto> progress(Long userId, Long subjectId);

    List<WrongNotebookDto> wrongBook(Long userId);
}
