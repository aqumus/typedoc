import * as ts from 'typescript';
import type { ReflectionConverter } from './types';
import { PropertyReflection, MethodReflection, DynamicPropertyReflection } from '../../models';
import { convertSignatureDeclaration } from './signature';

export const propertyConverter: ReflectionConverter<ts.PropertySignature | ts.PropertyDeclaration, PropertyReflection | MethodReflection> = {
    kind: [ts.SyntaxKind.PropertySignature, ts.SyntaxKind.PropertyDeclaration],
    async convert(context, symbol, [node]) {
        // Convention: In the following, `bar` should be considered a method.
        // class Foo { bar = () => this.something }
        if (node.initializer && ts.isArrowFunction(node.initializer)) {
            const container = new MethodReflection(symbol.name);
            container.signatures.push(await convertSignatureDeclaration(context.converter, symbol.name, node.initializer));
            return container;
        }

        return new PropertyReflection(symbol.name,
            await context.converter.convertTypeOrObject(node.type, context.checker.getTypeOfSymbolAtLocation(symbol, node)));
    }
}

export const accessorConverter: ReflectionConverter<ts.GetAccessorDeclaration | ts.SetAccessorDeclaration, DynamicPropertyReflection> = {
    kind: [ts.SyntaxKind.GetAccessor, ts.SyntaxKind.SetAccessor],
    async convert(context, symbol, [node]) {
        const hasGetter = node.kind === ts.SyntaxKind.GetAccessor;
        const hasSetter = symbol.declarations.some(decl => decl.kind === ts.SyntaxKind.SetAccessor);

        return new DynamicPropertyReflection(symbol.name,
            await context.converter.convertTypeOrObject(node.type, context.checker.getTypeOfSymbolAtLocation(symbol, node)),
            hasGetter,
            hasSetter);
    }
}
