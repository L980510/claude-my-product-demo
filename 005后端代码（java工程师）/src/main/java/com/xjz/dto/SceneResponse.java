package com.xjz.dto;

import com.xjz.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class SceneResponse {

    private String scene;
    private List<Category> categories;
}
