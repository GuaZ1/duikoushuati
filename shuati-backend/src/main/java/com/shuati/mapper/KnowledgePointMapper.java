package com.shuati.mapper;

import com.shuati.entity.KnowledgePoint;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface KnowledgePointMapper {

    @Select("SELECT * FROM knowledge_point WHERE subject_id = #{subjectId}")
    List<KnowledgePoint> findBySubjectId(Long subjectId);

    @Select("SELECT * FROM knowledge_point WHERE id = #{id}")
    KnowledgePoint findById(Long id);

    @Select("<script>SELECT * FROM knowledge_point " +
            "<where>" +
            "<if test='ids != null and ids.size > 0'>" +
            "id IN <foreach item='id' index='index' collection='ids' open='(' separator=',' close=')'>#{id}</foreach>" +
            "</if>" +
            "<if test='ids == null or ids.size == 0'>1 = 0</if>" +
            "</where>" +
            "</script>")
    List<KnowledgePoint> findByIds(@Param("ids") List<Long> ids);
}
