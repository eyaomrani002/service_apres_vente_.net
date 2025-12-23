using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NotificationAPI.Models;

namespace NotificationAPI.Services
{
    public class TwilioSmsSender : ISmsSender
    {
        private readonly HttpClient _client;
        private readonly SmsSettings _settings;
        private readonly ILogger<TwilioSmsSender> _logger;

        public TwilioSmsSender(HttpClient client, IOptions<SmsSettings> settings, ILogger<TwilioSmsSender> logger)
        {
            _client = client;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<SmsResult> SendAsync(string recipient, string body, CancellationToken cancellationToken = default)
        {
            if (!_settings.IsConfigured)
            {
                const string warning = "SMS provider is not configured.";
                _logger.LogWarning(warning);
                return new SmsResult(false, warning);
            }

            var request = new HttpRequestMessage(HttpMethod.Post, $"/2010-04-01/Accounts/{_settings.AccountSid}/Messages.json");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_settings.AccountSid}:{_settings.AuthToken}")));
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["To"] = recipient,
                ["From"] = _settings.FromNumber,
                ["Body"] = body
            });

            try
            {
                var response = await _client.SendAsync(request, cancellationToken);
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("SMS sent via Twilio to {Recipient}", recipient);
                    return new SmsResult(true, "SMS sent", responseBody);
                }

                _logger.LogWarning("Twilio rejected SMS to {Recipient}: {Status} {Payload}", recipient, response.StatusCode, responseBody);
                return new SmsResult(false, $"Twilio rejected request ({response.StatusCode}).", responseBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send Twilio SMS to {Recipient}", recipient);
                return new SmsResult(false, ex.Message);
            }
        }
    }
}