    package com.shuati;

    import org.junit.jupiter.api.Test;
    import org.springframework.boot.test.context.SpringBootTest;

    import java.util.concurrent.ArrayBlockingQueue;

    @SpringBootTest
    class ShuatiBackendApplicationTests {
        static ArrayBlockingQueue<Integer>  queue =new ArrayBlockingQueue<>(10);
        public static void main(String[] args) {


        }

        public static class consumer extends Thread{
            @Override
            public void run() {
                while (true) {
                synchronized (queue) {
                        if (queue.isEmpty()) {
                            //wait 生产者
                            try {
                                queue.wait();
                            } catch (InterruptedException e) {
                                throw new RuntimeException(e);
                            }
                        } else {
                            //notify 生产者
                            Integer value =queue.poll();
                            System.out.println("消费了");
                            queue.notify();
                        }
                    }
                }
            }
        }
        public static class product extends Thread{
            @Override
            public void run() {
                while (true) {
                    synchronized (queue) {
                        if (queue.size() > 10) {
                            try {
                                queue.wait();
                            } catch (InterruptedException e) {
                                throw new RuntimeException(e);
                            }
                        }
                        else {
                            queue.add(queue.size() + 1);
                            queue.notify();

                        }

                    }
                }
            }
        }

    }
