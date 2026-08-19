package com.shuati.mapper;

import com.shuati.entity.Subject;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface SubjectMapper {

    @Select("SELECT * FROM subject ORDER BY id")
    List<Subject> findAll();

    @Select("SELECT * FROM subject WHERE id = #{id}")
    Subject findById(Long id);
}
