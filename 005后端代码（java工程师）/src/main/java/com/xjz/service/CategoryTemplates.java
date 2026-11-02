package com.xjz.service;

import java.util.List;

/**
 * 两套场景分类模板（个人/经营），与前端 app.js 的 TEMPLATES、
 * 数据库设计 README 的默认分类清单完全一致。
 */
public final class CategoryTemplates {

    private CategoryTemplates() {
    }

    public record Item(String name, String type, String icon, String color) {
    }

    private static final List<Item> PERSONAL = List.of(
            new Item("餐饮", "expense", "🍜", "#E8577F"),
            new Item("交通", "expense", "🚌", "#A05AD9"),
            new Item("购物", "expense", "🛍️", "#F28A3E"),
            new Item("居住", "expense", "🏠", "#35A87C"),
            new Item("娱乐", "expense", "🎮", "#D9A81E"),
            new Item("医疗", "expense", "💊", "#3F91D6"),
            new Item("教育", "expense", "📚", "#C14B86"),
            new Item("人情", "expense", "🎁", "#82B440"),
            new Item("其他", "expense", "📦", "#7B6CC0"),
            new Item("工资", "income", "💰", "#35A87C"),
            new Item("奖金", "income", "🎉", "#82B440"),
            new Item("理财", "income", "📈", "#3F91D6"),
            new Item("红包", "income", "🧧", "#E8577F"),
            new Item("其他", "income", "📦", "#7B6CC0")
    );

    private static final List<Item> BUSINESS = List.of(
            new Item("进货采购", "expense", "📦", "#E8577F"),
            new Item("房租", "expense", "🏪", "#A05AD9"),
            new Item("水电", "expense", "💡", "#F28A3E"),
            new Item("人工", "expense", "👥", "#35A87C"),
            new Item("物流", "expense", "🚚", "#D9A81E"),
            new Item("耗材", "expense", "🧾", "#3F91D6"),
            new Item("税费", "expense", "🧮", "#C14B86"),
            new Item("其他", "expense", "📦", "#7B6CC0"),
            new Item("销售收入", "income", "🛒", "#35A87C"),
            new Item("服务收入", "income", "🛠️", "#3F91D6"),
            new Item("其他", "income", "📦", "#7B6CC0")
    );

    public static List<Item> items(String scene) {
        return "business".equals(scene) ? BUSINESS : PERSONAL;
    }
}
