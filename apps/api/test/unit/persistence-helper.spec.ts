import { describe, expect, it, vi } from "vitest";
import { PrismaRepositoryHelper } from "../../src/shared/infrastructure/persistence/prisma-repository.helper";
import {
  PrismaRepository,
  PrismaRepositoryHelper as exportedHelper,
} from "../../src/shared/infrastructure/persistence";
import { PrismaRepository as BaseRepository } from "../../src/shared/infrastructure/persistence/prisma-repository.base";

function fixture() {
  return {
    findMany: vi.fn().mockResolvedValue([{ id: "one" }, { id: "two" }]),
    count: vi.fn().mockResolvedValue(3),
  };
}
const map = (record: { id: string }) => record.id;
describe("shared pagination helper", () => {
  it.each(
    [
      { limit: 0 },
      { limit: -1 },
      { limit: 1.5 },
      { limit: NaN },
      { limit: Infinity },
      { limit: Number.MAX_SAFE_INTEGER + 1 },
      { offset: -1 },
      { offset: 1.5 },
      { offset: NaN },
      { offset: Infinity },
      { offset: Number.MAX_SAFE_INTEGER + 1 },
    ].map((options) => ({
      options,
      label: Object.entries(options)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(", "),
    })),
  )("rejects $label before executing either query", async ({ options }) => {
    const model = fixture();
    await expect(PrismaRepositoryHelper.paginate(model, {}, map, options)).rejects.toThrow(
      "Invalid pagination options",
    );
    expect(model.findMany).not.toHaveBeenCalled();
    expect(model.count).not.toHaveBeenCalled();
  });
  it("keeps facade exports identical and applies the existing defaults", async () => {
    expect(exportedHelper).toBe(PrismaRepositoryHelper);
    expect(PrismaRepository).toBe(BaseRepository);
    const model = fixture();
    const result = await PrismaRepositoryHelper.paginate(model, {}, map);
    expect(model.findMany).toHaveBeenCalledExactlyOnceWith({ take: 50, skip: 0 });
    expect(model.count).toHaveBeenCalledExactlyOnceWith({ where: undefined });
    expect(result).toEqual({
      items: ["one", "two"],
      total: 3,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });
  it("forwards filtering and projection without changing caller options", async () => {
    const model = fixture();
    const options = Object.freeze({
      where: { active: true },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    const result = await PrismaRepositoryHelper.paginate(model, options, map, {
      limit: 2,
      offset: 0,
    });
    expect(model.findMany).toHaveBeenCalledExactlyOnceWith({ ...options, take: 2, skip: 0 });
    expect(model.count).toHaveBeenCalledExactlyOnceWith({ where: options.where });
    expect(result).toEqual({ items: ["one", "two"], total: 3, limit: 2, offset: 0, hasMore: true });
    expect(options).not.toHaveProperty("take");
  });
  it.each([
    [2, 1, 3, false],
    [2, 5, 3, false],
    [1, 0, 3, true],
    [50, 0, 0, false],
  ])("reports hasMore for limit=%i offset=%i total=%i", async (limit, offset, total, expected) => {
    const model = fixture();
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(total);
    const result = await PrismaRepositoryHelper.paginate(model, {}, map, { limit, offset });
    expect(result.hasMore).toBe(expected);
    expect(result.items).toEqual([]);
  });
  it.each(["findMany", "count"] as const)(
    "propagates %s failure without mapping partial records",
    async (operation) => {
      const model = fixture();
      const error = new Error("Synthetic persistence failure");
      model[operation].mockRejectedValue(error);
      const mapper = vi.fn(map);
      await expect(PrismaRepositoryHelper.paginate(model, {}, mapper)).rejects.toBe(error);
      expect(mapper).not.toHaveBeenCalled();
    },
  );
  it("propagates mapper failures", async () => {
    const failure = new Error("Synthetic mapping failure");
    await expect(
      PrismaRepositoryHelper.paginate(fixture(), {}, () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
  });
  it("preserves delegate method receivers and forwards relation includes only to findMany", async () => {
    const model = {
      records: [{ id: "one" }],
      findMany() {
        return Promise.resolve(this.records);
      },
      count() {
        return Promise.resolve(this.records.length);
      },
    };
    expect(
      (await PrismaRepositoryHelper.paginate(model, { include: { items: true } }, map)).items,
    ).toEqual(["one"]);
  });
});
