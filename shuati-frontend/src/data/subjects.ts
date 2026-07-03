import { Subject } from '@/types';

const csharpImg = require('../assets/subjects/csharp.webp');
const jichuImg = require('../assets/subjects/计算机基础.webp');
const wangluoImg = require('../assets/subjects/计算机网络.webp');
const mysqlImg = require('../assets/subjects/mysql.webp');

const subjects: Subject[] = [
  { id: 1, name: 'C#', code: 'csharp', image: csharpImg },
  { id: 2, name: '计算机基础', code: 'computer-basics', image: jichuImg },
  { id: 3, name: '计算机网络', code: 'computer-network', image: wangluoImg },
  { id: 4, name: 'MySQL', code: 'mysql', image: mysqlImg },
  { id: 5, name: '数学', code: 'math' }
];

export default function getSubjectsMock(): Subject[] {
  return subjects;
}
