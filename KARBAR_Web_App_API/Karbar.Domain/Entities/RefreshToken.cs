namespace Karbar.Domain.Entities;

public class RefreshToken
{
    public int Id { get; set; }
    public string RefreshTokenId { get; set; }
    public string AccessToken { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiredAt { get; set; }
    public string UserGeneratedId { get; set; }
    public int UserId { get; set; }
    public User User { get; set; }
}
