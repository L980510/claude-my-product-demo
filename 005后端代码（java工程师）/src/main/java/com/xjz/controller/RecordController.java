package com.xjz.controller;

import com.xjz.common.Result;
import com.xjz.dto.RecordRequest;
import com.xjz.entity.Record;
import com.xjz.security.UserPrincipal;
import com.xjz.service.RecordService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/records")
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping
    public Result<List<Record>> list(@AuthenticationPrincipal UserPrincipal principal,
                                     @RequestParam(required = false) String month,
                                     @RequestParam(required = false) String start,
                                     @RequestParam(required = false) String end) {
        return Result.ok(recordService.list(principal.id(), month, start, end));
    }

    @PostMapping
    public Result<Record> create(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody RecordRequest req) {
        return Result.ok(recordService.create(principal.id(), req));
    }

    @PutMapping("/{id}")
    public Result<Record> update(@AuthenticationPrincipal UserPrincipal principal,
                                 @PathVariable Long id,
                                 @Valid @RequestBody RecordRequest req) {
        return Result.ok(recordService.update(principal.id(), id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id) {
        recordService.delete(principal.id(), id);
        return Result.ok();
    }
}
