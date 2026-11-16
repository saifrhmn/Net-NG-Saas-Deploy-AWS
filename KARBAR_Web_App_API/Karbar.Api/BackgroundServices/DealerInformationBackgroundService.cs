using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

public class DealerInformationBackgroundService : BackgroundService
{
    private readonly ILogger<DealerInformationBackgroundService> _logger;

    public DealerInformationBackgroundService(ILogger<DealerInformationBackgroundService> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Your background logic
                _logger.LogInformation("Running sales sync...");

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background service error");
            }
        }

        _logger.LogInformation("Background Service stopped");
    }
}
