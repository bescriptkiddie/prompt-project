import type { ImagePrompt } from '../types';

export const CREATIVE_COMPOSITE_PROMPTS: ImagePrompt[] = [
  {
    id: '11',
    title: '电影取景地打卡',
    model: 'Nano Banana Pro',
    promptZh: '选取《龙猫》电影里经典画面的实景，使用参考图中角色（动作符合电影氛围），生成一张超写实风格的旅行照片。请在画面里用原版电影海报的语言、字体、排版风格，在合适的位置标注三个地名：1. 取景地名 2. 城市 3. 国家。请让指定的角色看起来像是在那个地方旅游。像电影海报一样美地布局。',
    promptEn: 'Travel through time and space ⌛️ This time Nano Banana Pro takes you to movie filming locations 🎬📍\n\nUpload reference photo + input movie name to check in at the location 🛫\n\nEnglish Prompt:\nSelect a real-life scene from the classic shots of the movie "Your Name", use the character from the reference photo (action fits the movie atmosphere), and generate a hyper-realistic travel photo, aspect ratio 3:4 or 9:16. Please mark three place names in the picture using the language, font, and layout style of the original movie poster in appropriate positions: 1. Location Name 2. City 3. Country. Make the specified character look like they are traveling there. Layout as beautiful as a movie poster.',
    description: '将人物融入经典电影场景，生成具有电影海报质感的旅行打卡照。',
    category: '创意合成',
    source: '电影爱好者社区',
    imageUrl: '/images/电影取景地打卡.png',
  },
  {
    id: '14',
    title: '疯狂动物城自拍',
    model: 'Nano Banana Pro',
    promptZh: '提示词：创建一张超写实的自拍照。使用我上传的图像作为人物的精确参考 - 不要修改、改变或调整我上传图像中人物的任何特征。\n\n添加[疯狂动物城兔子警官]（迪士尼角色）站在这位真实人物旁边。\n\n场景：黑暗拥挤的电影院。背景有大屏幕播放疯狂动物城电影场景。电影般的灯光，温暖的环境光。\n\n构图：自拍角度。图像1中的真实人物（保持所有原始特征）和[角色名]一起自拍。[描述动作姿势] 两个人都清晰对焦。超高清、8K质量、超写实摄影风格，自然光线混合屏幕光晕，浅景深。\n\n关键：保持人物完全像和我上传图像的那样 - 不要改变她的发型、服装、配饰或任何面部特征。只添加疯狂动物城角色到场景中。',
    promptEn: 'Prompt: Create a hyper-realistic selfie. Use my uploaded image as a precise reference for the person - do not modify, change or adjust any features of the person in my uploaded image.\n\nAdd [Judy Hopps from Zootopia] (Disney character) standing next to this real person.\n\nScene: Dark crowded movie theater. Background has large screen playing Zootopia movie scene. Cinematic lighting, warm ambient light.\n\nComposition: Selfie angle. Real person from Image 1 (keeping all original features) and [Character Name] taking a selfie together. [Describe action pose] Both in sharp focus. Ultra HD, 8K quality, hyper-realistic photography style, natural light mixed with screen halo, shallow depth of field.\n\nKey: Keep the person exactly as in my uploaded image - do not change her hairstyle, clothing, accessories or any facial features. Only add Zootopia character to the scene.',
    description: '让现实人物与疯狂动物城角色合影，打破次元壁的趣味自拍。',
    category: '创意合成',
    source: '迪士尼粉丝二创',
    imageUrl: '/images/疯狂动物城自拍.png',
  },
  {
    id: '19',
    title: '记录小确幸｜实景涂鸦治愈照片生成器',
    model: 'Nano Banana Pro',
    promptZh: '保持原图片的真实摄影风格作为背景，不要重绘整个画面。\n\n仅在 {画面主体，如：猫咪/狗狗/鸭子/花朵/食物} 上使用简单的白色或黑色线条进行勾勒，添加可爱的涂鸦风格的眼睛、嘴巴、腮红等元素，使其拟人化，呈现出治愈、温暖的氛围。\n\n添加一个手绘风格的对话气泡，气泡内写上：「{治愈系文案，如：今天也要开心鸭～/晒会太阳吧/慢慢来，不着急}」\n\n⚠️ 重要约束：\n- 气泡内的文字必须使用中文\n- 线条风格保持简约可爱，不要过于复杂\n- 整体效果应为：实景照片 + 趣味线条涂鸦\n- 保留照片的真实质感和光影',
    promptEn: 'Keep the original photo as the real photographic background. Do NOT repaint or redraw the entire scene.\n\nOnly add simple white or black doodle outlines on the {main subject, e.g., cat/dog/duck/flower/food}. Add cute doodle-style eyes, mouth, blush, etc. to anthropomorphize the subject and create a warm, healing vibe.\n\nAdd a hand-drawn speech bubble with Chinese text inside: "{healing Chinese caption, e.g., 今天也要开心鸭～ / 晒会太阳吧 / 慢慢来，不着急}"\n\nImportant constraints:\n- The text inside the bubble MUST be Chinese\n- Keep the line style minimal and cute (not overly complex)\n- Final look should be: real photo + playful line doodles\n- Preserve the photo\'s real texture and lighting',
    description: '在实景照片上给主体加简约涂鸦和治愈气泡文案，适合小红书/朋友圈记录小确幸。',
    category: '创意合成',
    source: '原创',
    imageUrl: '/images/记录小确幸｜实景涂鸦治愈照片生成器.png',
  },
];
