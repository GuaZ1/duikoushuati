import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface CodeContentProps {
  content: string;
  // 普通文字与代码块共用的文字样式类（由调用方传入，保持和页面其他文字一致）
  textClassName?: string;
}

/**
 * 解析题干内容中的 markdown 代码块（``` 包裹），分别渲染：
 * - 普通文字：使用调用方传入的 textClassName（保持页面原样式）
 * - 代码块：等宽字体 + 浅灰背景 + pre-wrap 保留换行与缩进
 *
 * 存储约定：代码块用 ``` 单独成行包裹，代码行之间用真实换行、缩进用真实空格。
 */
const CodeContent: React.FC<CodeContentProps> = ({ content, textClassName }) => {
  if (!content) return null;

  // 按 ``` 分割：偶数段是普通文字，奇数段是代码块
  const parts = content.split('```');

  return (
    <View className={styles.wrapper}>
      {parts.map((part, i) => {
        // 去掉代码块首行的语言标识（如 ```csharp 后的 csharp）
        const isCode = i % 2 === 1;
        if (isCode) {
          const code = part.replace(/^\s*\w*\s*\n?/, '').replace(/\s+$/, '');
          if (!code) return null;
          return (
            <Text key={i} className={styles.codeBlock} space="nbsp">
              {code}
            </Text>
          );
        }
        if (!part) return null;
        return (
          <Text key={i} className={textClassName}>
            {part}
          </Text>
        );
      })}
    </View>
  );
};

export default CodeContent;
