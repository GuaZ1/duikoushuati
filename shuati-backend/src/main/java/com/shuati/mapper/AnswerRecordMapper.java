package com.shuati.mapper;

import com.shuati.entity.AnswerRecord;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AnswerRecordMapper {

    @Insert("INSERT INTO answer_record (student_id, question_id, student_answer, correct_status, score, created_at) " +
            "VALUES (#{studentId}, #{questionId}, #{studentAnswer}, #{correctStatus}, #{score}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AnswerRecord record);

    @Select("SELECT * FROM answer_record WHERE student_id = #{studentId} ORDER BY created_at DESC")
    List<AnswerRecord> findByStudentId(Long studentId);
}
