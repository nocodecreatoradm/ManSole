import { motion, useScroll, useTransform } from 'framer-motion';

export default function Background() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const scale1 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 1]);

  return (
    <div className="animated-bg">
      <motion.div style={{ y: y1, scale: scale1 }} className="blob blob-1" />
      <motion.div style={{ y: y2 }} className="blob blob-2" />
      <motion.div style={{ y: y3 }} className="blob blob-3" />
    </div>
  );
}
