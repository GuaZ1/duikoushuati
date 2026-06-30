package com.shuati.service.impl;

import com.shuati.dto.QuestionDto;
import com.shuati.dto.QuestionOptionDto;
import com.shuati.entity.Question;
import com.shuati.entity.QuestionOption;
import com.shuati.entity.Subject;
import com.shuati.enums.QuestionType;
import com.shuati.mapper.QuestionMapper;
import com.shuati.mapper.QuestionOptionMapper;
import com.shuati.mapper.SubjectMapper;
import com.shuati.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final SubjectMapper subjectMapper;

    @Override
    public List<QuestionDto> list(Long subjectId, Integer difficulty, QuestionType type) {
        List<Question> questions = questionMapper.findByConditions(subjectId, difficulty, type);
        Map<Long, String> subjectNameMap = subjectMapper.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Subject::getName));
        return questions.stream()
                .map(q -> convert(q, subjectNameMap))
                .collect(Collectors.toList());
    }

    @Override
    public QuestionDto detail(Long id) {
        Question question = questionMapper.findById(id);
        if (question == null) {
            throw new IllegalArgumentException("题目不存在");
        }
        Subject subject = subjectMapper.findById(question.getSubjectId());
        return convert(question, subject == null ? "" : subject.getName());
    }

    @Override
    @Transactional
    public Long create(QuestionDto dto) {
        Question question = new Question();
        question.setSubjectId(dto.getSubjectId());
        question.setKnowledgePointIds(dto.getKnowledgePointIds());
        question.setType(dto.getType());
        question.setDifficulty(dto.getDifficulty());
        question.setContent(dto.getContent());
        question.setAnswer(dto.getAnswer());
        question.setAnalysis(dto.getAnalysis());
        question.setScore(dto.getScore());
        question.setSource(dto.getSource());
        questionMapper.insert(question);
        saveOptions(question.getId(), dto.getOptions());
        return question.getId();
    }

    @Override
    @Transactional
    @CacheEvict(value = {"question", "questionOptions"}, key = "#id")
    public void update(Long id, QuestionDto dto) {
        Question existing = questionMapper.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("题目不存在");
        }
        Question question = new Question();
        question.setId(id);
        question.setSubjectId(dto.getSubjectId());
        question.setKnowledgePointIds(dto.getKnowledgePointIds());
        question.setType(dto.getType());
        question.setDifficulty(dto.getDifficulty());
        question.setContent(dto.getContent());
        question.setAnswer(dto.getAnswer());
        question.setAnalysis(dto.getAnalysis());
        question.setScore(dto.getScore());
        question.setSource(dto.getSource());
        questionMapper.update(question);
        questionOptionMapper.deleteByQuestionId(id);
        saveOptions(id, dto.getOptions());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"question", "questionOptions"}, key = "#id")
    public void delete(Long id) {
        Question existing = questionMapper.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("题目不存在");
        }
        questionOptionMapper.deleteByQuestionId(id);
        questionMapper.deleteById(id);
    }

    private void saveOptions(Long questionId, List<QuestionOptionDto> options) {
        if (options == null || options.isEmpty()) {
            return;
        }
        for (QuestionOptionDto dto : options) {
            QuestionOption option = new QuestionOption();
            option.setQuestionId(questionId);
            option.setOptionKey(dto.getOptionKey());
            option.setContent(dto.getContent());
            option.setIsCorrect(dto.getIsCorrect());
            questionOptionMapper.insert(option);
        }
    }

    private QuestionDto convert(Question question, Map<Long, String> subjectNameMap) {
        return convert(question, subjectNameMap.getOrDefault(question.getSubjectId(), ""));
    }

    private QuestionDto convert(Question question, String subjectName) {
        QuestionDto dto = new QuestionDto();
        dto.setId(question.getId());
        dto.setSubjectId(question.getSubjectId());
        dto.setSubjectName(subjectName);
        dto.setKnowledgePointIds(question.getKnowledgePointIds());
        dto.setType(question.getType());
        dto.setDifficulty(question.getDifficulty());
        dto.setContent(question.getContent());
        dto.setAnswer(question.getAnswer());
        dto.setAnalysis(question.getAnalysis());
        dto.setScore(question.getScore());
        dto.setSource(question.getSource());

        List<QuestionOption> options = questionOptionMapper.findByQuestionId(question.getId());
        List<QuestionOptionDto> optionDtos = options.stream().map(opt -> {
            QuestionOptionDto o = new QuestionOptionDto();
            o.setId(opt.getId());
            o.setOptionKey(opt.getOptionKey());
            o.setContent(opt.getContent());
            o.setIsCorrect(opt.getIsCorrect());
            return o;
        }).collect(Collectors.toList());
        dto.setOptions(optionDtos);
        return dto;
    }
}
