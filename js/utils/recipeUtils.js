// Dependencias: estas funciones deben estar definidas globalmente antes de este archivo
// getRecipesForItem, getRecipeDetails, getItemDetails, getItemPrices

// Se asume que getRecipesForItem está definido globalmente en recipeService.js


/**
 * Transforma una receta de la API al formato esperado por CraftIngredient
 */
window.transformRecipeToIngredient = async function(recipe, count = 1, parentMultiplier = 1) {
    try {
        if (!recipe || !recipe.output_item_id) {
            console.error('[ERROR] Receta inválida o sin output_item_id:', recipe);
            return null;
        }
        
        // Obtener detalles del ítem de salida
        const outputItem = await getItemDetails(recipe.output_item_id);
        if (!outputItem) {
            console.warn(`[WARN] No se pudo obtener detalles para el ítem ${recipe.output_item_id}`);
            return null;
        }
        
        // Obtener precios
        const prices = await getItemPrices(recipe.output_item_id) || {};
        
        // Crear estructura base del ingrediente

        const ingredient = {
            id: recipe.output_item_id,
            name: outputItem?.name || 'Ítem desconocido',
            icon: outputItem?.icon || '',
            rarity: outputItem?.rarity,
            count: count,
            parentMultiplier: parentMultiplier,
            buy_price: prices?.buys?.unit_price || 0,
            sell_price: prices?.sells?.unit_price || 0,
            is_craftable: recipe.type !== 'GuildConsumable',
            recipe: {
                id: recipe.id,
                type: recipe.type,
                output_item_count: recipe.output_item_count || 1,
                min_rating: recipe.min_rating,
                disciplines: recipe.disciplines || []
            },
            children: []
        };
        
        // Validar que la estructura básica sea válida
        if (!ingredient.id || !ingredient.name) {
            console.error('[ERROR] Estructura de ingrediente inválida:', ingredient);
            return null;
        }

        // Procesar ingredientes hijos si los hay
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            ingredient.children = await Promise.all(
                recipe.ingredients.map(async (ing) => {
                    // Verificar si el ingrediente es crafteable
                    const recipes = await getRecipesForItem(ing.item_id);
                    const isCraftable = recipes.length > 0;
                    
                    // Obtener detalles del ítem
                    const itemDetails = await getItemDetails(ing.item_id);
                    const prices = await getItemPrices(ing.item_id);
                    
                    const childIngredient = {
                        id: ing.item_id,
                        name: itemDetails?.name || 'Ítem desconocido',
                        icon: itemDetails?.icon || '',
                        rarity: itemDetails?.rarity,
                        count: ing.count,
                        parentMultiplier: 1, // Se ajustará en la recursión
                        buy_price: prices?.buys?.unit_price || 0,
                        sell_price: prices?.sells?.unit_price || 0,
                        is_craftable: isCraftable,
                        children: []
                    };


                    return childIngredient;
                })
            );
        }

        
        return ingredient;
    } catch (error) {
        console.error('Error en transformRecipeToIngredient:', error);
        return null;
    }
}

/**
 * Obtiene y transforma las recetas de un ítem
 */
window.getAndTransformRecipes = async function(itemId) {
    try {
        const recipes = await getRecipesForItem(itemId);
        if (!recipes || recipes.length === 0) return [];

        // getRecipesForItem ya devuelve los detalles completos de las recetas,
        // por lo que no es necesario volver a llamar a getRecipeDetails
        const transformedRecipes = await Promise.all(
            recipes.map(recipe =>
                window.transformRecipeToIngredient(recipe)
            )
        );

        return transformedRecipes.filter(Boolean); // Filtrar nulos
    } catch (error) {
        console.error('Error en getAndTransformRecipes:', error);
        return [];
    }
}

/**
 * Carga recursivamente los ingredientes de un ítem
 */
window.loadIngredientTree = async function(ingredient, depth = 0, maxDepth = 3) {
    if (depth >= maxDepth || !ingredient.is_craftable) {
        return ingredient;
    }
    
    try {
        const recipes = await getRecipesForItem(ingredient.id);
        if (recipes.length === 0) {
            return ingredient;
        }

        // getRecipesForItem devuelve objetos de receta completos, tomar la primera
        const recipe = recipes[0];
        if (!recipe) return ingredient;
        
        // Transformar y cargar los ingredientes hijos
        ingredient.children = await Promise.all(
            recipe.ingredients.map(async (ing) => {
                // Buscar la receta real del hijo
                const childRecipes = await getRecipesForItem(ing.item_id);
                let childIngredient = null;
                if (childRecipes.length > 0) {
                    const childRecipe = childRecipes[0];
                    if (childRecipe) {
                        // Pasa la receta real y el count correcto
                        childIngredient = await transformRecipeToIngredient(childRecipe, ing.count, 1);
                    }
                }
                // Si no hay receta, crea un ingrediente básico
                if (!childIngredient) {
                    // Obtener detalles básicos del ítem
                    const itemDetails = await getItemDetails(ing.item_id);
                    const prices = await getItemPrices(ing.item_id);
                    childIngredient = {
                        id: ing.item_id,
                        name: itemDetails?.name || '',
                        icon: itemDetails?.icon || '',
                        rarity: itemDetails?.rarity,
                        count: ing.count,
                        parentMultiplier: 1,
                        buy_price: prices?.buys?.unit_price || 0,
                        sell_price: prices?.sells?.unit_price || 0,
                        is_craftable: false,
                        children: []
                    };
                }
                // Recursividad solo si es crafteable
                if (childIngredient.is_craftable) {
                    return await loadIngredientTree(childIngredient, depth + 1, maxDepth);
                } else {
                    return childIngredient;
                }
            })
        );
        
        return ingredient;
    } catch (error) {
        console.error(`Error cargando ingrediente ${ingredient.id}:`, error);
        return ingredient;
    }
}
