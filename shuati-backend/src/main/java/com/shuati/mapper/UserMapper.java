package com.shuati.mapper;

import com.shuati.entity.User;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM app_user WHERE id = #{id}")
    User findById(Long id);

    @Select("SELECT * FROM app_user WHERE openid = #{openid}")
    User findByOpenid(String openid);

    @Select("SELECT * FROM app_user WHERE token = #{token}")
    User findByToken(String token);

    @Insert("INSERT INTO app_user (role, openid, phone, nickname, avatar, grade, school, created_at) " +
            "VALUES (#{role}, #{openid}, #{phone}, #{nickname}, #{avatar}, #{grade}, #{school}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);

    @Update("UPDATE app_user SET role = #{role}, openid = #{openid}, phone = #{phone}, nickname = #{nickname}, " +
            "avatar = #{avatar}, grade = #{grade}, school = #{school}, token = #{token}, " +
            "token_expire_at = #{tokenExpireAt} WHERE id = #{id}")
    int update(User user);
}
