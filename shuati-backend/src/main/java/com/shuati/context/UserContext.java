package com.shuati.context;

import com.shuati.entity.User;
import com.shuati.enums.UserRole;

public final class UserContext {

    private static final ThreadLocal<User> CURRENT = new ThreadLocal<>();

    private UserContext() {
    }

    public static void set(User user) {
        CURRENT.set(user);
    }

    public static User get() {
        return CURRENT.get();
    }

    public static Long getUserId() {
        User user = CURRENT.get();
        return user == null ? null : user.getId();
    }

    public static void requireTeacher() {
        User user = CURRENT.get();
        if (user == null || user.getRole() != UserRole.TEACHER) {
            throw new IllegalStateException("无教师权限");
        }
    }

    public static void clear() {
        CURRENT.remove();
    }
}
