declare module "point-in-polygon" {
  function inside(
    point: [number, number],
    polygon: [number, number][]
  ): boolean;

  export = inside;
}
