/**
 * 通道模式枚举（类型侧定义）。
 * 出现位置：types/ChannelMode、constants/ChannelMode、constructors/FixtureConstructor、
 * constants/channelProfiles、utils/formatters、constants/logTemplates、
 * constants/errorMessages、pages/FixturesPage、pages/CuesPage、components/common/ColorChannelSlider。
 */
export const ChannelModeValues = ["RGB", "RGBW", "DIMMER_ONLY", "MOVING_HEAD"] as const;
export type ChannelMode = (typeof ChannelModeValues)[number];
