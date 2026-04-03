import { describe, it, expect, beforeEach } from "vitest";
import { isDisposableEmail, checkRateLimit } from "../security";

describe("isDisposableEmail", () => {
  it("detects disposable email domains", () => {
    expect(isDisposableEmail("test@guerrillamail.com")).toBe(true);
    expect(isDisposableEmail("test@mailinator.com")).toBe(true);
    expect(isDisposableEmail("test@yopmail.com")).toBe(true);
    expect(isDisposableEmail("test@10minutemail.com")).toBe(true);
  });

  it("allows legitimate email domains", () => {
    expect(isDisposableEmail("user@gmail.com")).toBe(false);
    expect(isDisposableEmail("user@yahoo.com")).toBe(false);
    expect(isDisposableEmail("user@company.co.kr")).toBe(false);
    expect(isDisposableEmail("seller@amazon.com")).toBe(false);
  });

  it("rejects emails without domain", () => {
    expect(isDisposableEmail("nodomain")).toBe(true);
    expect(isDisposableEmail("")).toBe(true);
  });

  it("is case-insensitive on domain", () => {
    expect(isDisposableEmail("test@GUERRILLAMAIL.COM")).toBe(true);
    expect(isDisposableEmail("test@Mailinator.Com")).toBe(true);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset by using unique keys per test
  });

  it("allows requests within limit", () => {
    const key = `test-allow-${Date.now()}`;
    const r1 = checkRateLimit(key, 3, 60000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, 3, 60000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, 3, 60000);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding limit", () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, 2, 60000);
    checkRateLimit(key, 2, 60000);

    const r3 = checkRateLimit(key, 2, 60000);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = `test-reset-${Date.now()}`;
    // Window of 1ms
    checkRateLimit(key, 1, 1);
    checkRateLimit(key, 1, 1);

    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 5) {} // busy wait 5ms

    const result = checkRateLimit(key, 1, 1);
    expect(result.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const key1 = `test-ind-a-${Date.now()}`;
    const key2 = `test-ind-b-${Date.now()}`;

    checkRateLimit(key1, 1, 60000);
    const r1 = checkRateLimit(key1, 1, 60000);
    expect(r1.allowed).toBe(false);

    const r2 = checkRateLimit(key2, 1, 60000);
    expect(r2.allowed).toBe(true);
  });
});
