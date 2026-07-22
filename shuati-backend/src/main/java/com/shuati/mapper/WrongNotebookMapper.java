package com.shuati.mapper;

import com.shuati.entity.WrongNotebook;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface WrongNotebookMapper {

    @Select("SELECT * FROM wrong_notebook WHERE student_id = #{studentId} AND question_id = #{questionId}")
    WrongNotebook findByStudentIdAndQuestionId(@Param("studentId") Long studentId, @Param("questionId") Long questionId);

    @Select("SELECT * FROM wrong_notebook WHERE student_id = #{studentId} AND mastered = false ORDER BY last_wrong_at DESC")
    List<WrongNotebook> findByStudentIdAndMasteredFalse(Long studentId);

    @Insert("INSERT INTO wrong_notebook (student_id, question_id, wrong_count, weight, last_wrong_at, mastered) " +
            "VALUES (#{studentId}, #{questionId}, #{wrongCount}, #{weight}, #{lastWrongAt}, #{mastered})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(WrongNotebook notebook);

    @Update("UPDATE wrong_notebook SET wrong_count = #{wrongCount}, weight = #{weight}, last_wrong_at = #{lastWrongAt}, mastered = #{mastered} " +
            "WHERE id = #{id}")
    int update(WrongNotebook notebook);
}
