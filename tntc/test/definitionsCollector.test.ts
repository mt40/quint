import { describe, it } from 'mocha'
import { assert } from 'chai'
import { collectDefinitions } from '../src/definitionsCollector'
import { buildModuleWithDefs } from './builders/ir'

describe('collectDefinitions', () => {
  const moduleName = 'wrapper'

  describe('collecting operator names', () => {
    it('collects constant definitions', () => {
      const tntModule = buildModuleWithDefs(['const TEST_CONSTANT: int'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.deepInclude(result!.valueDefinitions.map(d => d.identifier), 'TEST_CONSTANT')
    })

    it('collects variable definitions', () => {
      const tntModule = buildModuleWithDefs(['var test_variable: int'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.deepInclude(result!.valueDefinitions.map(d => d.identifier), 'test_variable')
    })

    it('collects operator definitions and its parameters including a scope', () => {
      const tntModule = buildModuleWithDefs(['def test_operator(x) = x + 1'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), ['test_operator', 'x'])
    })

    it('collects names from application inside definition body', () => {
      const tntModule = buildModuleWithDefs(['def test_operator = S.filter(x -> x > 0)'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), ['test_operator', 'x'])
    })

    it('collects names from let inside definition body', () => {
      const tntModule = buildModuleWithDefs(['def test_operator = val x = 10 { x > 0 }'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), ['test_operator', 'x'])
    })

    it('collects instances and scoped variables inside parameters', () => {
      const tntModule = buildModuleWithDefs([
        'module test_module { def a = 2 module nested_module { def b = 3 } }',
        'module test_module_instance = test_module(a = val x = 10 {x})',
      ])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), [
        'test_module',
        'test_module_instance',
        'test_module_instance::a',
        'test_module_instance::nested_module',
        'test_module_instance::nested_module::b',
        'x',
      ])
    })

    it('collects module definitions', () => {
      const tntModule = buildModuleWithDefs(['module test_module { module nested_module { def a = 1 } }'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), [
        'test_module',
        'test_module::nested_module',
        'test_module::nested_module::a',
      ])
    })

    it('collects assume definitions and scoped variables in body', () => {
      const tntModule = buildModuleWithDefs(['assume test_assumption = N > val x = 2 { x }'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), ['test_assumption', 'x'])
    })

    it('collects imported module\'s definitions as unscoped definitions', () => {
      const tntModule = buildModuleWithDefs([
        'module test_module { def a = 1 module nested_module { def b = 1 } }',
        'import test_module.*',
      ])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.includeDeepMembers(result!.valueDefinitions.map(d => d.identifier), [
        'test_module',
        'test_module::a',
        'test_module::nested_module',
        'test_module::nested_module::b',
        'a',
        // After import
        'nested_module',
        'nested_module::b',
      ])
    })

    it('collects imported module\'s named definition as unscoped definition', () => {
      const tntModule = buildModuleWithDefs([
        'module test_module { def a = 1 }',
        'import test_module.a',
      ])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.deepInclude(result!.valueDefinitions.map(d => d.identifier), 'a')
    })
  })

  describe('collecting type aliases', () => {
    it('collects aliases from typedefs', () => {
      const tntModule = buildModuleWithDefs(['type TEST_TYPE = int'])

      const result = collectDefinitions(tntModule).get(moduleName)

      assert.deepInclude(result!.typeDefinitions.map(d => d.identifier), 'TEST_TYPE')
    })
  })
})
