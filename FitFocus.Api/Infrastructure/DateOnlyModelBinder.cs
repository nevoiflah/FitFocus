using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace FitFocus.Api.Infrastructure;

public sealed class DateOnlyModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var value = bindingContext.ValueProvider.GetValue(bindingContext.ModelName).FirstValue;

        if (string.IsNullOrEmpty(value))
        {
            return Task.CompletedTask;
        }

        if (DateOnly.TryParse(value, out var date))
        {
            bindingContext.Result = ModelBindingResult.Success(date);
        }
        else
        {
            bindingContext.ModelState.TryAddModelError(
                bindingContext.ModelName,
                $"The value '{value}' is not a valid date. Use yyyy-MM-dd format.");
        }

        return Task.CompletedTask;
    }
}

public sealed class DateOnlyModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        if (context.Metadata.ModelType == typeof(DateOnly) ||
            context.Metadata.ModelType == typeof(DateOnly?))
        {
            return new DateOnlyModelBinder();
        }

        return null;
    }
}
