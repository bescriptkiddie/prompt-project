import type { ImagePrompt } from '../types';

export const ILLUSTRATION_PROMPTS: ImagePrompt[] = [
  {
    id: '7',
    title: '鬼灭之刃浮世绘闪卡',
    model: 'DOUBAO',
    promptZh: '核心指令： 一张日式浮世绘风格的收藏级集换式卡牌设计，竖构图。插画风格需要紧密模仿《鬼灭之刃》的视觉美学，特征包括：粗细变化的墨笔轮廓线、传统木版画的配色方案，以及戏剧性的动态构图。\n\n主体描述： 卡牌主角是 {角色名字}（称号：{柱名/称号}），处于动态战斗姿势，手持 {武器描述}。 角色正在施展 {呼吸法招式名称}，周围环绕着 {视觉特效描述}（例如：巨大的火焰 / 水龙 / 旋风），这些特效需要以 传统日式水墨画（Sumi-e）风格 呈现。\n\n背景与材质： 背景需融合 纹理化的镭射闪卡（Holographic Foil）效果，在传统水墨元素下方闪烁。\n\n边框： 图片周围要有 日本传统纹样（如青海波或麻叶纹）组成的装饰性边框。底部有一个风格化的横幅，上面用古朴的日式书法写着 "{日文汉字名字}"。',
    promptEn: 'Core Instruction: A Japanese Ukiyo-e style collectible trading card design, vertical composition. The illustration style needs to closely mimic the visual aesthetics of "Demon Slayer", characterized by: ink brush outlines with varying thickness, traditional woodblock print color schemes, and dramatic dynamic composition.\n\nSubject Description: The card protagonist is {Character Name} (Title: {Hashira Name/Title}), in a dynamic fighting pose, holding {Weapon Description}. The character is unleashing {Breathing Style Move Name}, surrounded by {Visual Effect Description} (e.g., giant flames / water dragon / whirlwind), these effects need to be presented in Traditional Japanese Sumi-e style.\n\nBackground & Material: The background needs to fuse textured Holographic Foil effects, shimmering beneath traditional ink elements.\n\nBorder: The image should be surrounded by a decorative border composed of Traditional Japanese patterns (such as Seigaiha or Asanoha). At the bottom is a stylized banner with "{Japanese Kanji Name}" written in rustic Japanese calligraphy.',
    description: '创作鬼灭之刃风格的浮世绘闪卡，结合传统艺术与现代卡牌设计。',
    category: '动漫插画',
    source: 'Midjourney 风格探索',
    imageUrl: '/images/鬼灭之刃浮世绘闪卡.png',
  },
  {
    id: '15',
    title: '法式速写新闻漫画',
    model: 'Nano Banana Pro',
    promptZh: '绘制新闻漫画要求如下：这是一幅模仿法式速写风格的漫画，描绘了面条厂工人"手搓飞机"引发的争议场景。画面左侧是拿着规章制度质疑安全性的监管者，右侧是支持民间发明的围观群众，中间则是正在面粉袋和机器零件堆中专注打磨螺旋桨的工人大叔。线条要简练但富有张力，色彩以红白蓝三色为主调，带有轻微的讽刺幽默感。背景要有模糊的工厂环境暗示。左下角要有艺术家的签名。',
    promptEn: 'Draw a news cartoon with the following requirements: This is a cartoon mimicking French sketch style, depicting the controversial scene of a noodle factory worker "hand-rubbing an airplane". On the left are regulators holding rules and regulations questioning safety, on the right are onlookers supporting folk invention, and in the middle is the worker uncle focused on polishing the propeller amidst flour bags and machine parts. Lines should be concise but full of tension, colors dominated by red, white and blue, with a slight sense of satirical humor. Background should have vague hints of factory environment. Artist\'s signature in the bottom left corner.',
    description: '具有法式幽默和速写质感的新闻漫画，适合表达社会热点或讽刺主题。',
    category: '插画',
    source: 'New Yorker 风格',
    imageUrl: '/images/法式速写新闻漫画.png',
  },
];
