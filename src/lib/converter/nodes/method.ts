import * as ts from "typescript";
import type { ReflectionConverter } from "./types";
import { MethodReflection } from "../../models";
import { convertSignatureDeclaration } from "./signature";
import { getVisibility } from "../utils";
import { waterfall } from "../../utils/array";

export const methodConverter: ReflectionConverter<
  ts.MethodSignature | ts.MethodDeclaration,
  MethodReflection
> = {
  kind: [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration],
  async convert(context, symbol, nodes) {
    // All signatures must have the same visibility.
    const container = new MethodReflection(
      symbol.name,
      getVisibility(nodes[0])
    );

    // With overloads, only the signatures without an implementation are "real"
    const includeImplementation = nodes.length === 1;

    const realNodes = nodes.filter(
      (node) =>
        ts.isMethodDeclaration(node) &&
        Boolean(node.body) === includeImplementation
    );

    const signatures = await waterfall(realNodes, (node) =>
      convertSignatureDeclaration(context.converter, symbol.name, node)
    );

    for (const signature of signatures) {
      container.addChild(signature);
    }

    return container;
  },
};
