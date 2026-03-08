from django.db import models


class Portfolio(models.Model):
    owner = models.ForeignKey(
        "staff.Staff",
        on_delete=models.CASCADE,
        related_name="portfolios",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    sector = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Stock(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="stocks"
    )

    stock_id = models.CharField(max_length=25)   # Ticker (e.g. TATAMOTORS.NS)
    name = models.CharField(max_length=100)
    sector = models.CharField(max_length=100, blank=True, default="")

    current_price = models.FloatField(null=True, blank=True)
    pe_ratio = models.FloatField(null=True, blank=True)
    eps = models.FloatField(null=True, blank=True)
    market_cap = models.FloatField(null=True, blank=True)
    intrinsic_value = models.FloatField(null=True, blank=True)
    min_price = models.FloatField(null=True, blank=True)
    max_price = models.FloatField(null=True, blank=True)
    discount_percentage = models.FloatField(null=True, blank=True)
    opportunity_score = models.FloatField(null=True, blank=True)
    discount_level = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["portfolio", "stock_id"],
                name="unique_stock_per_portfolio",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.stock_id})"

    @property
    def ticker(self):
        return self.stock_id

    @ticker.setter
    def ticker(self, value):
        self.stock_id = value

    @property
    def discount_percent(self):
        return self.discount_percentage
