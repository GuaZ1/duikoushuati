package com.shuati.mapper;

import com.shuati.entity.User;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM app_user WHERE id = #{id}")
    User findById(Long id);

    @Insert("INSERT INTO app_user (role, phone, nickname, avatar, grade, school, created_at) " +
            "VALUES (#{role}, #{phone}, #{nickname}, #{avatar}, #{grade}, #{school}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE app_user SET role = #{role}, phone = #{phone}, nickname = #{nickname}, " +
            "avatar = #{avatar}, grade = #{grade}, school = #{school} WHERE id = #{id}")
    int update(User user);
}
