namespace NotificationAPI.Services
{
    public sealed class SmsResult
    {
        public SmsResult(bool isSuccessful, string? message = null, string? providerPayload = null)
        {
            IsSuccessful = isSuccessful;
            Message = message;
            ProviderPayload = providerPayload;
        }

        public bool IsSuccessful { get; }
        public string? Message { get; }
        public string? ProviderPayload { get; }
    }
}