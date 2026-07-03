package com.shuati.service.impl;

import com.shuati.dto.PracticeQuestionDto;
import com.shuati.dto.PracticeQuestionOptionDto;
import com.shuati.dto.QuestionDto;
import com.shuati.dto.QuestionOptionDto;
import com.shuati.dto.QuestionPracticeVo;
import com.shuati.entity.Question;
import com.shuati.entity.QuestionOption;
import com.shuati.entity.Subject;
import com.shuati.enums.QuestionType;
import com.shuati.mapper.QuestionMapper;
import com.shuati.mapper.QuestionOptionMapper;
import com.shuati.mapper.SubjectMapper;
import com.shuati.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final SubjectMapper subjectMapper;
    private final CacheManager cacheManager;

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
    @Cacheable(value = "practiceQuestions",
            key = "#subjectId + '-' + (#difficulty != null ? #difficulty : '') + '-' + (#type != null ? #type : '')")
    public List<PracticeQuestionDto> listForPractice(Long subjectId, Integer difficulty, QuestionType type) {
        List<QuestionPracticeVo> rows = questionMapper.findPracticeQuestionsByConditions(subjectId, difficulty, type);
        Map<Long, PracticeQuestionDto> questionMap = new LinkedHashMap<>();
        Map<Long, List<QuestionOption>> optionMap = new LinkedHashMap<>();
        Map<Long, Question> questionCacheMap = new LinkedHashMap<>();

        for (QuestionPracticeVo row : rows) {
            PracticeQuestionDto dto = questionMap.computeIfAbsent(row.getQuestionId(), id -> {
                PracticeQuestionDto q = new PracticeQuestionDto();
                q.setId(row.getQuestionId());
                q.setSubjectId(row.getSubjectId());
                q.setSubjectName(row.getSubjectName());
                q.setType(row.getType());
                q.setDifficulty(row.getDifficulty());
                q.setContent(row.getContent());
                q.setScore(row.getScore());
                return q;
            });
            if (row.getOptionId() != null) {
                PracticeQuestionOptionDto option = new PracticeQuestionOptionDto();
                option.setId(row.getOptionId());
                option.setOptionKey(row.getOptionKey());
                option.setContent(row.getOptionContent());
                dto.getOptions().add(option);

                optionMap.computeIfAbsent(row.getQuestionId(), k -> new ArrayList<>())
                        .add(buildOption(row));
            }
            questionCacheMap.computeIfAbsent(row.getQuestionId(), k -> buildQuestion(row));
        }

        Cache questionCache = cacheManager.getCache("question");
        Cache optionsCache = cacheManager.getCache("questionOptions");
        if (questionCache != null) {
            questionCacheMap.forEach(questionCache::put);
        }
        if (optionsCache != null) {
            optionMap.forEach(optionsCache::put);
        }

        return new ArrayList<>(questionMap.values());
    }

    private Question buildQuestion(QuestionPracticeVo row) {
        Question q = new Question();
        q.setId(row.getQuestionId());
        q.setSubjectId(row.getSubjectId());
        q.setType(row.getType());
        q.setDifficulty(row.getDifficulty());
        q.setContent(row.getContent());
        q.setAnswer(row.getAnswer());
        q.setAnalysis(row.getAnalysis());
        q.setScore(row.getScore());
        q.setKnowledgePointIds(row.getKnowledgePointIds());
        q.setSource(row.getSource());
        return q;
    }

    private QuestionOption buildOption(QuestionPracticeVo row) {
        QuestionOption opt = new QuestionOption();
        opt.setId(row.getOptionId());
        opt.setQuestionId(row.getQuestionId());
        opt.setOptionKey(row.getOptionKey());
        opt.setContent(row.getOptionContent());
        opt.setIsCorrect(row.getIsCorrect());
        return opt;
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
    @CacheEvict(value = {"question", "questionOptions", "practiceQuestions"}, allEntries = true)
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
    @CacheEvict(value = {"question", "questionOptions", "practiceQuestions"}, allEntries = true)
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
    @CacheEvict(value = {"question", "questionOptions", "practiceQuestions"}, allEntries = true)
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
