import { Recipe } from '../../types'
import { generateId } from '../../utils/helpers'

export interface RecipeFormData extends Partial<Recipe> {}

export const createEmptyRecipe = (): RecipeFormData => ({
  name: '',
  enabled: true,
  urlPattern: '',
  selector: '',
  componentType: 'button',
  componentText: '',
  componentStyle: '',
  workflowType: 'copy',
  workflowConfig: {}
})

export const getDefaultRecipes = (): Recipe[] => [
  {
    id: 'github-pr-review',
    name: 'GitHub PR Review Button',
    enabled: true,
    urlPattern: '*://github.com/*/pull/*',
    selector: '.gh-header-actions',
    componentType: 'button',
    componentText: 'Review',
    componentStyle: 'background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; margin-left: 8px;',
    workflowType: 'modal',
    workflowConfig: {
      sourceSelector: '.js-comment-body p',
      modalTitle: 'PR Review',
      modalContent: 'Copied PR description for review'
    }
  },
  {
    id: 'copy-page-title',
    name: 'Copy Page Title',
    enabled: true,
    urlPattern: '*://*/*',
    selector: 'body',
    componentType: 'button',
    componentText: 'Copy Title',
    componentStyle: 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: #007bff; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;',
    workflowType: 'copy',
    workflowConfig: {
      sourceSelector: 'title'
    }
  }
]

export const recipeToFormData = (recipe: Recipe): RecipeFormData => ({ ...recipe })

export const formDataToRecipe = (formData: RecipeFormData, existingId?: string): Recipe => ({
  id: existingId || generateId(),
  name: formData.name || '',
  enabled: formData.enabled ?? true,
  urlPattern: formData.urlPattern || '',
  selector: formData.selector || '',
  componentType: formData.componentType || 'button',
  componentText: formData.componentText || '',
  componentStyle: formData.componentStyle || '',
  workflowType: formData.workflowType || 'copy',
  workflowConfig: formData.workflowConfig || {}
})