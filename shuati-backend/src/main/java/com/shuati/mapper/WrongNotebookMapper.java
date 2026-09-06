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

    // 普通练习答对：错题记录存在则直接置为已掌握（保持 weight 原值），
    // 单条 UPDATE 原子完成，替换原先「先查后写」，避免并发丢失更新。
    @Update("UPDATE wrong_notebook SET mastered = TRUE WHERE student_id = #{studentId} AND question_id = #{questionId}")
    int markMastered(@Param("studentId") Long studentId, @Param("questionId") Long questionId);

    // 普通练习答错：无记录则插入（首次错题），已存在则原子 wrong_count+1 并置回未掌握；
    // 一条 INSERT ... ON DUPLICATE KEY UPDATE 完成「有则改、无则建」，并发作答也不会丢次数。
    @Insert("INSERT INTO wrong_notebook (student_id, question_id, wrong_count, weight, last_wrong_at, mastered) " +
            "VALUES (#{studentId}, #{questionId}, 1, 0, NOW(), FALSE) " +
            "ON DUPLICATE KEY UPDATE wrong_count = wrong_count + 1, mastered = FALSE, last_wrong_at = NOW()")
    int upsertWrong(@Param("studentId") Long studentId, @Param("questionId") Long questionId);

    // 错题本专项练习答对：weight +1（封顶 5），达到 5 即视为掌握，仅对未掌握记录生效。
    // 注意：MySQL 单表 UPDATE 按从左到右赋值，mastered 必须基于旧 weight 判定，故写在 weight 更新之前。
    @Update("UPDATE wrong_notebook " +
            "SET mastered = (weight + 1 >= 5), weight = LEAST(weight + 1, 5) " +
            "WHERE student_id = #{studentId} AND question_id = #{questionId} AND mastered = FALSE")
    int incrementWeightOnCorrect(@Param("studentId") Long studentId, @Param("questionId") Long questionId);

    // 错题本专项练习答错：权重清零重来（仅未掌握记录）
    @Update("UPDATE wrong_notebook SET weight = 0 " +
            "WHERE student_id = #{studentId} AND question_id = #{questionId} AND mastered = FALSE")
    int resetWeightOnWrong(@Param("studentId") Long studentId, @Param("questionId") Long questionId);

    @Insert("INSERT INTO wrong_notebook (student_id, question_id, wrong_count, weight, last_wrong_at, mastered) " +
            "VALUES (#{studentId}, #{questionId}, #{wrongCount}, #{weight}, #{lastWrongAt}, #{mastered})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(WrongNotebook notebook);

    @Update("UPDATE wrong_notebook SET wrong_count = #{wrongCount}, weight = #{weight}, last_wrong_at = #{lastWrongAt}, mastered = #{mastered} " +
            "WHERE id = #{id}")
    int update(WrongNotebook notebook);
}
