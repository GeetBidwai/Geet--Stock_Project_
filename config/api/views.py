from rest_framework.response import Response
from rest_framework.decorators import api_view


@api_view(['GET'])
def api_root(request):
    return Response({
        "message": "API is running",
        "endpoints": [
            "/api/portfolios/",
            "/api/portfolios/<id>/",
            "/api/portfolios/<id>/stocks/",
            "/api/portfolios/<id>/stocks/<stock_id>/",
            "/api/portfolios/<id>/stocks/<stock_id>/?range=1mo",
            "/api/stocks/suggest/?q=tata",
            "/api/metals/analytics/?range=1mo",
            "/api/login/"
        ]
    })
