import type { ImagePrompt } from '../types';

export const THREE_D_PROMPTS: ImagePrompt[] = [
  {
    id: '8',
    title: 'Q 版梦幻店铺',
    model: 'DOUBAO',
    promptZh: '【品牌名称】的3D Q版微缩概念店，创意设计的外观灵感来自品牌最具标志性的产品或包装（例如巨大的【品牌核心产品，如全家桶/汉堡/甜甜圈/烤鸭】）。商店有两层，带有大玻璃窗，清晰展示舒适且装饰精美的内部：【品牌主色调】主题装饰，温暖的灯光，以及穿着与品牌匹配服装的忙碌员工。可爱的微小人物在街道上漫步或坐着，周围环绕着长椅、路灯和盆栽植物，营造出迷人的城市景观。使用Cinema 4D以微缩城市景观风格渲染，具有盲盒玩具美学，细节丰富且逼真，沐浴在柔和的灯光中，唤起轻松的下午氛围。 --ar 2:3\n\n品牌名称：星巴克',
    promptEn: '3D chibi-style miniature concept store of {Brand Name}, creatively designed with an exterior inspired by the brand\'s most iconic product or packaging (such as a giant {brand\'s core product, e.g., chicken bucket/hamburger/donut/roast duck}). The store features two floors with large glass windows clearly showcasing the cozy and finely decorated interior: {brand\'s primary color}-themed decor, warm lighting, and busy staff dressed in outfits matching the brand. Adorable tiny figures stroll or sit along the street, surrounded by benches, street lamps, and potted plants, creating a charming urban scene. Rendered in a miniature cityscape style using Cinema 4D, with a blind-box toy aesthetic, rich in details and realism, and bathed in soft lighting that evokes a relaxing afternoon atmosphere. --ar 2:3\n\nBrand name: Starbucks',
    description: '生成可爱的3D微缩店铺模型，适合品牌概念设计和盲盒风格。',
    category: '3D设计',
    source: 'Midjourney 建筑系列',
    imageUrl: '/images/Q 版梦幻店铺.png',
  },
  {
    id: '20',
    title: '人物封面｜3D 九宫格杂志拼贴',
    model: 'Nano Banana Pro',
    promptZh:
      '核心约束（绝对优先级）：\n' +
      '- 9 个位置必须是同一个人物：相同五官/妆造/发型（低发髻+少量凌乱发丝），拒绝模糊。\n' +
      '- 9 个位置必须穿同一套服装：黑色毛衣 + 白色裤子 + 相同配饰（耳环/项链/乐福鞋）。\n' +
      '- 必须大景深（f/16 或更大），无虚化/无散景/无失焦区域；所有人脸清晰锐利。\n\n' +
      '画面结构：超现实 3×3 时尚杂志网格拼贴（竖构图 2:3 或 9:16），单元格之间用清晰的粗白网格线（约 3–4px）分隔。\n' +
      '- 背景层（Z=0）：3×3 共 9 格，但只有 8 格可见；中心格 [2,2] 必须被前景 3D 人物 100% 完全遮挡。\n' +
      '- 背景 8 格：同一位中国女性、同一套衣服，以 8 种不同杂志编辑风格呈现（仅改变姿势/构图/光线氛围）：\n' +
      '  [1,1] Vogue：站姿挺拔，一手插兜，目光坚定；高对比、戏剧阴影。\n' +
      '  [1,2] Harper\'s Bazaar：侧脸回头看肩；柔和迷人灯光。\n' +
      '  [1,3] Elle 街头：行走步伐轻松自信；自然采光都市感。\n' +
      '  [2,1] iD：二郎腿坐在极简立方体；大胆图形构图、鲜艳背景。\n' +
      '  [2,3] 迷幻/实验：动态动作衣料飘逸；实验角度、艺术化编辑。\n' +
      '  [3,1] Marie Claire 职场：双臂交叉专业站姿；中性简洁企业美学。\n' +
      '  [3,2] GQ 极简：倚墙放松优雅；建筑构图、简洁线条。\n' +
      '  [3,3] W 前卫：艺术化姿势与手势；大胆对比、时尚大片。\n\n' +
      '前景层（Z 轴向前 5–10cm）：超写实巨型全身 3D 人像（同一位女性同一套衣服），位于画面精确中心，完全遮蔽中心格 [2,2]。\n' +
      '- 头部几乎触及画布顶边，鞋子几乎触及画布底边，占据最大垂直空间，形成强烈 3D 弹出效果。\n' +
      '- 姿势：动态向前行走（步态中段），手叉腰或自然摆动，直视镜头，气场强。\n' +
      '- 叠压与遮挡：前景自然越界并局部遮挡相邻格（10–20%）：上 [1,2] 头发/头部；左 [2,1] 左臂/袖子；右 [2,3] 右臂；下 [3,2] 腿/脚。重叠处自然打破白色网格边界，无硬切边缘。\n\n' +
      '光线与质感：\n' +
      '- 背景网格：均匀明亮影棚光（无明显阴影），背景为明亮简约的混凝土/白色工作室。\n' +
      '- 前景人物：左上 45° 主光 + 柔和轮廓光；与背景同方向；前景亮度 +10%、饱和度 +20%，皮肤与织物纹理清晰。\n' +
      '- 阴影：前景投影到背景网格上（模糊 12px，rgba(0,0,0,0.25)，偏移 X=6px Y=10px），并有接触阴影（模糊 8px，rgba(0,0,0,0.35)）。\n\n' +
      '技术规格：RGB / sRGB，分辨率 ≥ 2000×3000，专业时尚摄影质感，画面干净不杂乱。\n\n' +
      '严格禁止：不同人物/不同服装/改变面部特征；浅景深/虚化/散景；网格线缺失或不清晰；低清像素化；肢体畸形/融合；4×4 等非 3×3 网格；中心格可见；平面无 3D 深度。\n\n' +
      '建议参数：--ar 2:3 --style raw --v 6.1 --stylize 300 --q 2',
    promptEn:
      'Absolute constraints (highest priority):\n' +
      '- The SAME person must appear in all 9 positions: identical facial features/makeup/hairstyle (low bun with a few loose strands). No blur.\n' +
      '- The SAME outfit across all 9 positions: black sweater + white pants + identical accessories (earrings/necklace/loafers).\n' +
      '- Deep depth of field (f/16 or smaller aperture). No bokeh, no selective focus, no out-of-focus faces.\n\n' +
      'Composition: a surreal 3×3 fashion magazine grid collage (vertical 2:3 or 9:16). Thick white grid lines (~3–4px) clearly separate cells.\n' +
      '- Background layer (Z=0): 3×3 grid with 8 visible cells; the center cell [2,2] must be 100% fully hidden by the foreground 3D figure.\n' +
      '- 8 background cells: the same Chinese female model in the same outfit, rendered in 8 distinct editorial styles (only pose/composition/lighting mood changes): Vogue, Harper\'s Bazaar, Elle street, iD, psychedelic/experimental, Marie Claire corporate, GQ minimal, W avant-garde.\n\n' +
      'Foreground layer (pops forward 5–10cm on Z-axis): a hyper-realistic giant full-body 3D figure of the same model wearing the same outfit, placed precisely at the center, completely covering [2,2].\n' +
      '- Head nearly touches the top edge; shoes nearly touch the bottom edge; maximum vertical space for strong 3D pop-out illusion.\n' +
      '- Pose: walking forward mid-stride, one hand on waist or natural swing, direct eye contact, powerful presence.\n' +
      '- Natural overlaps that break grid borders (10–20%): top [1,2] hair/head, left [2,1] left arm/sleeve, right [2,3] right arm, bottom [3,2] legs/feet. No hard cutout edges.\n\n' +
      'Lighting & realism:\n' +
      '- Background grid: evenly lit bright studio, clean concrete/white studio backdrop.\n' +
      '- Foreground: key light from top-left at 45° + soft rim light; same light direction as background; foreground brightness +10%, saturation +20%, crisp skin/fabric texture.\n' +
      '- Shadows: cast shadow onto the grid (blur 12px, rgba(0,0,0,0.25), offset X=6px Y=10px) + contact shadow (blur 8px, rgba(0,0,0,0.35)).\n\n' +
      'Technical: RGB/sRGB, resolution ≥ 2000×3000, professional fashion photography look, clean composition.\n\n' +
      'Strictly avoid: different people/outfits/altered face; shallow DOF/bokeh/blur; missing grid lines; low-res/pixelation; deformed limbs; non-3×3 grids; visible center cell; flat/no 3D depth.\n\n' +
      'Suggested params: --ar 2:3 --style raw --v 6.1 --stylize 300 --q 2',
    description: '同一人物同一套服装的 3×3 杂志网格 + 前景巨型 3D 弹出人像封面效果。',
    category: '3D设计',
    source: '原创',
    imageUrl: '/images/人物封面｜3D 九宫格杂志拼贴.png',
  },
];
