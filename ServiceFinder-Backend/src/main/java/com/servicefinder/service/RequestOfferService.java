package com.servicefinder.service;

import com.servicefinder.entity.*;
import com.servicefinder.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RequestOfferService {

    @Autowired private RequestOfferRepository offerRepository;
    @Autowired private ServiceRequestRepository requestRepository;
    @Autowired private ProviderRepository providerRepository;
    @Autowired private CommissionService commissionService;

    public List<RequestOffer> getAllOffersForProvider(Long providerUserId) {
        List<Provider> providers = providerRepository.findByUserId(providerUserId);
        if (providers.isEmpty()) return new ArrayList<>();
        
        List<Long> providerIds = providers.stream().map(Provider::getId).collect(Collectors.toList());
        return offerRepository.findByProvider_IdIn(providerIds);
    }

    @Transactional
    public void counterOffer(Long offerId, Long providerUserId, BigDecimal counterPrice, String message) {
        RequestOffer offer = offerRepository.findById(offerId).orElseThrow(() -> new RuntimeException("Offer not found"));
        if (!offer.getStatus().equals("PENDING")) throw new RuntimeException("Offer already processed");
        if (!offer.getProvider().getUserId().equals(providerUserId)) throw new RuntimeException("This offer is not for you");

        offer.setStatus("COUNTER_OFFERED");
        offer.setCounterPrice(counterPrice);
        offer.setProviderMessage(message);
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);

        ServiceRequest request = offer.getRequest();
        request.setStatus("BIDDING");
        requestRepository.save(request);
    }

    @Transactional
    public ServiceRequest acceptOffer(Long offerId, Long providerUserId, BigDecimal agreedPrice) {
        RequestOffer offer = offerRepository.findById(offerId).orElseThrow(() -> new RuntimeException("Offer not found"));
        if (!offer.getStatus().equals("PENDING") && !offer.getStatus().equals("COUNTER_OFFERED")) throw new RuntimeException("Offer already processed");
        if (!offer.getProvider().getUserId().equals(providerUserId)) throw new RuntimeException("This offer is not for you");
        
        Provider provider = offer.getProvider();
        ServiceRequest request = offer.getRequest();

        boolean success = commissionService.processCommissionDeduction(request, agreedPrice, provider);
        if (!success) throw new RuntimeException("Insufficient Wallet Balance! Please top up your wallet.");

        request.setProvider(provider);
        request.setAgreedPrice(agreedPrice);
        request.setStatus("ACCEPTED");
        requestRepository.save(request);

        offer.setStatus("ACCEPTED");
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);

        List<RequestOffer> otherOffers = offerRepository.findByRequest_Id(request.getId());
        for (RequestOffer o : otherOffers) {
            if (!o.getId().equals(offerId) && (o.getStatus().equals("PENDING") || o.getStatus().equals("COUNTER_OFFERED"))) {
                o.setStatus("EXPIRED");
                o.setRespondedAt(LocalDateTime.now());
                offerRepository.save(o);
            }
        }
        return request;
    }

    @Transactional
    public void rejectOffer(Long offerId, Long providerUserId) {
        RequestOffer offer = offerRepository.findById(offerId).orElseThrow(() -> new RuntimeException("Offer not found"));
        if (!offer.getProvider().getUserId().equals(providerUserId)) throw new RuntimeException("This offer is not for you");
        offer.setStatus("REJECTED");
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);
    }
}
