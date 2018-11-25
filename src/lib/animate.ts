export const finish = (animation: Animation): Promise<void> => {
  if (animation.finished) {
    return animation.finished.then(() => {});
  }
  return new Promise(resolve => {
    animation.onfinish = () => resolve();
  });
};

export const options = (
  duration: number,
  delay: number = 0,
): KeyframeAnimationOptions => ({
  duration: duration * (1 - delay),
  delay: duration * delay,
  fill: 'both',
  easing: 'ease-in-out',
});
