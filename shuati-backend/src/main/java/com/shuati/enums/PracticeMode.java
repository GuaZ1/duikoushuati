package com.shuati.enums;

/**
 * 刷题模式：与 answer_record.mode 字段对应。
 * WRONGBOOK 为错题本专项练习，走独立的权重累计逻辑。
 */
public enum PracticeMode {
    PRACTICE,
    EXAM,
    CHAPTER,
    WRONGBOOK
}
