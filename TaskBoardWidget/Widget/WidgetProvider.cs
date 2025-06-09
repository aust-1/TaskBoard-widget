using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using Microsoft.Windows.Widgets.Providers;

namespace TaskBoardWidget.Widget
{
    public class CompactWidgetInfo
    {
        public string? WidgetId { get; set; }
        public string? WidgetName { get; set; }
        public int CustomState { get; set; } = 0;
        public bool IsActive { get; set; } = false;
        public bool InCustomization { get; set; } = false;
    }

    internal class WidgetProvider : IWidgetProvider, IWidgetProvider2
    {
        public static readonly Dictionary<string, CompactWidgetInfo> RunningWidgets = [];
        static ManualResetEvent emptyWidgetListEvent = new(false);

        public static ManualResetEvent GetEmptyWidgetListEvent() => emptyWidgetListEvent;

        const string countWidgetTemplate = """
{
    "type": "AdaptiveCard",
    "body": [
        {"type": "TextBlock", "text": "You have clicked the button ${count} times"}
    ],
    "actions": [
        {"type": "Action.Execute", "title": "Increment", "verb": "inc"}
    ],
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.5"
}
""";

        public WidgetProvider()
        {
            var running = WidgetManager.GetDefault().GetWidgetInfos();
            foreach (var info in running)
            {
                var ctx = info.WidgetContext;
                var id = ctx.Id;
                var name = ctx.DefinitionId;
                if (!RunningWidgets.ContainsKey(id))
                {
                    CompactWidgetInfo runningWidgetInfo = new CompactWidgetInfo
                    {
                        WidgetId = id,
                        WidgetName = name,
                    };
                    int count;
                    if (int.TryParse(info.CustomState.ToString(), out count))
                        runningWidgetInfo.CustomState = count;
                    RunningWidgets[id] = runningWidgetInfo;
                }
            }
        }

        public void CreateWidget(WidgetContext widgetContext)
        {
            var widgetId = widgetContext.Id;
            var widgetName = widgetContext.DefinitionId;
            CompactWidgetInfo runningWidgetInfo = new()
            {
                WidgetId = widgetId,
                WidgetName = widgetName,
            };
            RunningWidgets[widgetId] = runningWidgetInfo;
            UpdateWidget(runningWidgetInfo);
        }

        public void DeleteWidget(string widgetId, string customState)
        {
            RunningWidgets.Remove(widgetId);
            if (RunningWidgets.Count == 0)
            {
                emptyWidgetListEvent.Set();
            }
        }

        public void OnActionInvoked(WidgetActionInvokedArgs actionInvokedArgs)
        {
            var verb = actionInvokedArgs.Verb;
            if (verb == "inc")
            {
                var widgetId = actionInvokedArgs.WidgetContext.Id;
                if (RunningWidgets.ContainsKey(widgetId))
                {
                    var localWidgetInfo = RunningWidgets[widgetId];
                    localWidgetInfo.CustomState++;
                    UpdateWidget(localWidgetInfo);
                }
            }
        }

        public void OnWidgetContextChanged(WidgetContextChangedArgs contextChangedArgs)
        {
            var widgetContext = contextChangedArgs.WidgetContext;
            var widgetId = widgetContext.Id;
            if (RunningWidgets.ContainsKey(widgetId))
            {
                var localWidgetInfo = RunningWidgets[widgetId];
                UpdateWidget(localWidgetInfo);
            }
        }

        public void Activate(WidgetContext widgetContext)
        {
            var widgetId = widgetContext.Id;
            if (RunningWidgets.ContainsKey(widgetId))
            {
                var localWidgetInfo = RunningWidgets[widgetId];
                localWidgetInfo.IsActive = true;
                UpdateWidget(localWidgetInfo);
            }
        }

        public void Deactivate(string widgetId)
        {
            if (RunningWidgets.ContainsKey(widgetId))
            {
                var localWidgetInfo = RunningWidgets[widgetId];
                localWidgetInfo.IsActive = false;
            }
        }

        public void OnCustomizationRequested(WidgetCustomizationRequestedArgs customizationArgs)
        {
            var widgetId = customizationArgs.WidgetContext.Id;
            if (RunningWidgets.ContainsKey(widgetId))
            {
                var localWidgetInfo = RunningWidgets[widgetId];
                localWidgetInfo.InCustomization = true;
                UpdateWidget(localWidgetInfo);
            }
        }

        void UpdateWidget(CompactWidgetInfo localWidgetInfo)
        {
            WidgetUpdateRequestOptions updateOptions = new(localWidgetInfo.WidgetId);
            updateOptions.Template = countWidgetTemplate;
            updateOptions.Data = "{ \"count\": " + localWidgetInfo.CustomState + " }";
            updateOptions.CustomState = localWidgetInfo.CustomState.ToString();
            WidgetManager.GetDefault().UpdateWidget(updateOptions);
        }
    }
}
