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

    @Select("<script>SELECT * FROM knowledge_point WHERE id IN " +
            "<foreach item='id' index='index' collection='ids' open='(' separator=',' close=')'>#{id}</foreach>" +
            "</script>")
    List<KnowledgePoint> findByIds(@Param("ids") List<Long> ids);
}
