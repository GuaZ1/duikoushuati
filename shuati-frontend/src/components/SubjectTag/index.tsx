import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SubjectTagProps {
  name: string;
  active?: boolean;
  onClick?: () => void;
}

const SubjectTag: React.FC<SubjectTagProps> = ({ name, active, onClick }) => {
  return (
    <View
      className={classnames(styles.tag, active && styles.tagActive)}
      onClick={onClick}
    >
      <Text className={styles.text}>{name}</Text>
    </View>
  );
};

export default SubjectTag;
