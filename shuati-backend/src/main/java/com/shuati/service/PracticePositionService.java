package com.shuati.service;

import com.shuati.dto.LastPracticePositionDto;

public interface PracticePositionService {

    LastPracticePositionDto getLastPosition(Long userId);
}
